from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-please-1234567890")

# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin only")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------- Models ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str

class ProductIn(BaseModel):
    name: str
    brand: str
    category: str
    abv: float = 0.0
    volume_ml: int = 750
    price_myr: float
    stock: int = 0
    image_url: str = ""
    description: str = ""
    featured: bool = False
    origin: str = ""

class Product(ProductIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderItem(BaseModel):
    product_id: str
    name: str
    price_myr: float
    quantity: int

class OrderIn(BaseModel):
    customer_name: str
    phone: str
    address: str
    notes: str = ""
    items: List[OrderItem]
    payment_method: str = "bank_transfer"

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    phone: str
    address: str
    notes: str = ""
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    total: float
    payment_method: str
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderStatusUpdate(BaseModel):
    status: str

# ---------- App ----------
app = FastAPI(title="Master Liquors API")
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "Master Liquors API", "status": "ok"}

# ---------- Auth ----------
@api_router.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"])
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=os.environ.get("COOKIE_SECURE", "true").lower() == "true", samesite="none" if os.environ.get("COOKIE_SECURE", "true").lower() == "true" else "lax", max_age=604800, path="/"
    )
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
    }

@api_router.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

# ---------- Products ----------
@api_router.get("/products")
async def list_products(category: Optional[str] = None, search: Optional[str] = None,
                        featured: Optional[bool] = None):
    q = {}
    if category and category != "all":
        q["category"] = category
    if featured is not None:
        q["featured"] = featured
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
        ]
    items = await db.products.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.get("/products/categories")
async def categories():
    cats = await db.products.distinct("category")
    return sorted(cats)

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p

@api_router.post("/products")
async def create_product(body: ProductIn, admin=Depends(get_current_admin)):
    p = Product(**body.model_dump())
    doc = p.model_dump()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductIn, admin=Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    update = body.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update})
    out = await db.products.find_one({"id": product_id}, {"_id": 0})
    return out

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

# ---------- Orders ----------
def _generate_order_number() -> str:
    return "ML" + datetime.now(timezone.utc).strftime("%y%m%d%H%M%S") + uuid.uuid4().hex[:4].upper()

@api_router.post("/orders")
async def create_order(body: OrderIn):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    subtotal = sum(i.price_myr * i.quantity for i in body.items)
    delivery_fee = 0.0 if subtotal >= 300 else 15.0
    total = subtotal + delivery_fee
    order = Order(
        order_number=_generate_order_number(),
        customer_name=body.customer_name,
        phone=body.phone,
        address=body.address,
        notes=body.notes,
        items=body.items,
        subtotal=round(subtotal, 2),
        delivery_fee=delivery_fee,
        total=round(total, 2),
        payment_method=body.payment_method,
    )
    doc = order.model_dump()
    await db.orders.insert_one(doc)
    doc.pop("_id", None)
    # Decrement stock (best-effort)
    for it in body.items:
        await db.products.update_one(
            {"id": it.product_id, "stock": {"$gte": it.quantity}},
            {"$inc": {"stock": -it.quantity}},
        )
    return doc

@api_router.get("/orders")
async def list_orders(admin=Depends(get_current_admin)):
    items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusUpdate, admin=Depends(get_current_admin)):
    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    out = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return out

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    low_stock = await db.products.count_documents({"stock": {"$lt": 5}})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    total_orders = await db.orders.count_documents({})
    pipeline = [{"$match": {"status": {"$ne": "cancelled"}}},
                {"$group": {"_id": None, "rev": {"$sum": "$total"}}}]
    rev_cur = db.orders.aggregate(pipeline)
    rev = 0
    async for r in rev_cur:
        rev = r["rev"]
    return {
        "total_products": total_products,
        "low_stock": low_stock,
        "pending_orders": pending_orders,
        "total_orders": total_orders,
        "revenue": round(rev, 2),
    }

# ---------- Public config ----------
@api_router.get("/config/storefront")
async def storefront_config():
    return {
        "whatsapp_number": os.environ.get("WHATSAPP_NUMBER", "60123456789"),
        "bank_name": os.environ.get("BANK_NAME", "MAYBANK"),
        "bank_account_name": os.environ.get("BANK_ACCOUNT_NAME", "MASTER LIQUORS SDN BHD"),
        "bank_account_number": os.environ.get("BANK_ACCOUNT_NUMBER", "5141-2345-6789"),
        "currency": "MYR",
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Seeding ----------
SEED_PRODUCTS = [
    {"name": "Jack Daniel's Old No.7", "brand": "Jack Daniel's", "category": "Whisky", "abv": 40, "volume_ml": 750, "price_myr": 189.0, "stock": 24, "image_url": "https://images.unsplash.com/photo-1592620352607-53100d32f9fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Tennessee whiskey, charcoal mellowed for smoothness.", "origin": "USA", "featured": True},
    {"name": "Smirnoff Red Label", "brand": "Smirnoff", "category": "Vodka", "abv": 37.5, "volume_ml": 750, "price_myr": 79.0, "stock": 40, "image_url": "https://images.unsplash.com/photo-1703437871687-427b69640924?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Triple-distilled, ultra-clean vodka.", "origin": "Russia", "featured": True},
    {"name": "Macallan 12 Double Cask", "brand": "Macallan", "category": "Whisky", "abv": 40, "volume_ml": 700, "price_myr": 549.0, "stock": 8, "image_url": "https://images.unsplash.com/photo-1744730850404-43e48b576470?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Single malt scotch aged in sherry-seasoned oak casks.", "origin": "Scotland", "featured": True},
    {"name": "Hendrick's Gin", "brand": "Hendrick's", "category": "Gin", "abv": 41.4, "volume_ml": 700, "price_myr": 245.0, "stock": 15, "image_url": "https://images.unsplash.com/photo-1592620352607-53100d32f9fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Cucumber-and-rose infused premium Scottish gin.", "origin": "Scotland", "featured": False},
    {"name": "Bacardi Carta Blanca", "brand": "Bacardi", "category": "Rum", "abv": 37.5, "volume_ml": 750, "price_myr": 89.0, "stock": 30, "image_url": "https://images.unsplash.com/photo-1703437871687-427b69640924?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Classic white rum, light and crisp for cocktails.", "origin": "Cuba", "featured": False},
    {"name": "Patron Silver Tequila", "brand": "Patron", "category": "Tequila", "abv": 40, "volume_ml": 750, "price_myr": 329.0, "stock": 12, "image_url": "https://images.unsplash.com/photo-1744730850404-43e48b576470?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Ultra-premium silver tequila from blue agave.", "origin": "Mexico", "featured": True},
    {"name": "Hennessy VS Cognac", "brand": "Hennessy", "category": "Cognac", "abv": 40, "volume_ml": 700, "price_myr": 289.0, "stock": 18, "image_url": "https://images.unsplash.com/photo-1592620352607-53100d32f9fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Lively & fragrant cognac, perfectly balanced.", "origin": "France", "featured": False},
    {"name": "Heineken Lager 24-Pack", "brand": "Heineken", "category": "Beer", "abv": 5, "volume_ml": 7920, "price_myr": 145.0, "stock": 50, "image_url": "https://images.unsplash.com/photo-1703437871687-427b69640924?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Premium lager in a 24-can party pack.", "origin": "Netherlands", "featured": False},
    {"name": "Moet & Chandon Brut Imperial", "brand": "Moet & Chandon", "category": "Champagne", "abv": 12, "volume_ml": 750, "price_myr": 459.0, "stock": 10, "image_url": "https://images.unsplash.com/photo-1744730850404-43e48b576470?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Iconic French champagne. Celebration in a bottle.", "origin": "France", "featured": True},
    {"name": "Tanqueray London Dry", "brand": "Tanqueray", "category": "Gin", "abv": 43.1, "volume_ml": 700, "price_myr": 175.0, "stock": 22, "image_url": "https://images.unsplash.com/photo-1592620352607-53100d32f9fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Quintessential London Dry gin.", "origin": "England", "featured": False},
    {"name": "Johnnie Walker Black Label", "brand": "Johnnie Walker", "category": "Whisky", "abv": 40, "volume_ml": 700, "price_myr": 219.0, "stock": 3, "image_url": "https://images.unsplash.com/photo-1703437871687-427b69640924?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "12-year-old blended scotch whisky.", "origin": "Scotland", "featured": True},
    {"name": "Don Julio Reposado", "brand": "Don Julio", "category": "Tequila", "abv": 38, "volume_ml": 700, "price_myr": 389.0, "stock": 6, "image_url": "https://images.unsplash.com/photo-1744730850404-43e48b576470?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxwcmVtaXVtJTIwbGlxdW9yJTIwYm90dGxlJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODYwMzc4MHww&ixlib=rb-4.1.0&q=85", "description": "Aged in American white-oak barrels for 8 months.", "origin": "Mexico", "featured": False},
]

@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@masterliquors.my").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Neon@2026")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Master Admin",
            "role": "admin",
            "password_hash": hash_password(admin_password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info(f"Updated admin password for: {admin_email}")

    # Seed products
    count = await db.products.count_documents({})
    if count == 0:
        docs = []
        for p in SEED_PRODUCTS:
            prod = Product(**p)
            docs.append(prod.model_dump())
        await db.products.insert_many(docs)
        logger.info(f"Seeded {len(docs)} products")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
