"""
Seed data generator for TRAMS.
Populates the database with realistic Indian transport industry sample data.
"""

from datetime import datetime, timezone, timedelta

from app.database import SessionLocal
from app.core import hash_password, generate_auction_number
from app.models.user import User
from app.models.transporter import Transporter, Vehicle, Driver
from app.models.auction import Auction, AuctionInvite
from app.models.bid import Bid, BidHistory, AuctionResult
from app.models.master import Route, Material, Branch, Customer
from app.models.notification import Notification
from app.models.settings import CompanySettings


def seed_if_empty():
    """Seed the database only if it's empty."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return
        seed_database(db)
    finally:
        db.close()


def seed_database(db):
    """Populate database with sample data."""

    # =================== Company Settings ===================
    settings = CompanySettings(
        company_name="TRAMS Enterprise Pvt. Ltd.",
        tagline="Smart Transport Procurement Platform",
        address="Plot No. 42, Industrial Area, Phase-II",
        phone="+91 11 4567 8900",
        email="admin@trams.in",
        website="https://trams.in",
        currency="INR",
        timezone="Asia/Kolkata",
    )
    db.add(settings)

    # =================== Admin User ===================
    admin = User(
        email="admin@trams.in",
        password_hash=hash_password("Admin@123"),
        full_name="Rajesh Kumar Singh",
        phone="+91 98765 43210",
        role="admin",
        is_active=True,
    )
    db.add(admin)

    manager_user = User(
        email="manager@trams.in",
        password_hash=hash_password("Manager@123"),
        full_name="Priya Sharma",
        phone="+91 98765 43211",
        role="manager",
        is_active=True,
    )
    db.add(manager_user)

    db.flush()

    # =================== Transporters ===================
    transporter_data = [
        {
            "email": "transport1@demo.in", "name": "Amit Patel", "phone": "+91 97001 00001",
            "company": "Shree Balaji Transport Co.", "gst": "27AADCS1234F1ZH",
            "pan": "AADCS1234F", "city": "Mumbai", "state": "Maharashtra",
            "pincode": "400001", "vehicles": [
                ("MH04AB1234", "Tata 407", 3.5, "Tata", 2022, "Closed"),
                ("MH04CD5678", "Eicher Pro 1110", 5.5, "Eicher", 2023, "Open"),
                ("MH04EF9012", "Tata LPT 1613", 16.0, "Tata", 2021, "Container"),
            ],
            "drivers": [("Raju Yadav", "+91 90001 00001", "MH0420210012345"), ("Suresh Patil", "+91 90001 00002", "MH0420200098765")],
        },
        {
            "email": "transport2@demo.in", "name": "Vikram Reddy", "phone": "+91 97001 00002",
            "company": "Sri Venkateswara Logistics", "gst": "36BBDES5678G2AI",
            "pan": "BBDES5678G", "city": "Hyderabad", "state": "Telangana",
            "pincode": "500001", "vehicles": [
                ("TS09GH3456", "Ashok Leyland Dost", 1.5, "Ashok Leyland", 2023, "Open"),
                ("TS09IJ7890", "Bharat Benz 1217", 12.0, "Bharat Benz", 2022, "Container"),
            ],
            "drivers": [("Naresh Kumar", "+91 90002 00001", "TS0920220054321")],
        },
        {
            "email": "transport3@demo.in", "name": "Sunil Gupta", "phone": "+91 97001 00003",
            "company": "Gupta Roadways Pvt. Ltd.", "gst": "09CCFGS9012H3BJ",
            "pan": "CCFGS9012H", "city": "Lucknow", "state": "Uttar Pradesh",
            "pincode": "226001", "vehicles": [
                ("UP32KL1234", "Mahindra Bolero Pickup", 1.2, "Mahindra", 2023, "Open"),
                ("UP32MN5678", "Tata Ultra T.7", 7.0, "Tata", 2022, "Closed"),
                ("UP32OP9012", "Eicher Pro 6037", 25.0, "Eicher", 2021, "Trailer"),
                ("UP32QR3456", "Ashok Leyland 3718", 37.0, "Ashok Leyland", 2023, "Trailer"),
            ],
            "drivers": [
                ("Ramesh Singh", "+91 90003 00001", "UP3220210067890"),
                ("Manoj Verma", "+91 90003 00002", "UP3220220011111"),
                ("Arun Kumar", "+91 90003 00003", "UP3220230022222"),
            ],
        },
        {
            "email": "transport4@demo.in", "name": "Deepak Jain", "phone": "+91 97001 00004",
            "company": "Jain Express Cargo", "gst": "08DDHIJ3456K4CK",
            "pan": "DDHIJ3456K", "city": "Jaipur", "state": "Rajasthan",
            "pincode": "302001", "vehicles": [
                ("RJ14ST7890", "Tata 1109g", 9.0, "Tata", 2022, "Closed"),
                ("RJ14UV1234", "Eicher Pro 3015", 15.0, "Eicher", 2023, "Container"),
            ],
            "drivers": [("Gopal Singh", "+91 90004 00001", "RJ1420210033333")],
        },
        {
            "email": "transport5@demo.in", "name": "Harpreet Singh", "phone": "+91 97001 00005",
            "company": "Punjab Star Transport", "gst": "03EEKLM7890N5DL",
            "pan": "EEKLM7890N", "city": "Ludhiana", "state": "Punjab",
            "pincode": "141001", "vehicles": [
                ("PB10WX5678", "Tata Prima 4928", 49.0, "Tata", 2023, "Trailer"),
                ("PB10YZ9012", "Ashok Leyland 4923", 49.0, "Ashok Leyland", 2022, "Trailer"),
                ("PB10AB3456", "Bharat Benz 4228", 42.0, "Bharat Benz", 2023, "Trailer"),
            ],
            "drivers": [
                ("Gurpreet Singh", "+91 90005 00001", "PB1020220044444"),
                ("Manjinder Kaur", "+91 90005 00002", "PB1020230055555"),
            ],
        },
    ]

    transporters = []
    for td in transporter_data:
        user = User(
            email=td["email"],
            password_hash=hash_password("Transport@123"),
            full_name=td["name"],
            phone=td["phone"],
            role="transporter",
            is_active=True,
        )
        db.add(user)
        db.flush()

        transporter = Transporter(
            user_id=user.id,
            company_name=td["company"],
            gst_number=td["gst"],
            pan_number=td["pan"],
            city=td["city"],
            state=td["state"],
            pincode=td["pincode"],
            address=f"Industrial Area, {td['city']}",
            rating=round(3.5 + (hash(td['company']) % 15) / 10, 1),
            is_verified=True,
        )
        db.add(transporter)
        db.flush()
        transporters.append(transporter)

        for vd in td["vehicles"]:
            vehicle = Vehicle(
                transporter_id=transporter.id,
                vehicle_number=vd[0],
                vehicle_type=vd[1],
                capacity_tons=vd[2],
                make_model=vd[3],
                year=vd[4],
                body_type=vd[5],
                is_active=True,
            )
            db.add(vehicle)

        for dd in td["drivers"]:
            driver = Driver(
                transporter_id=transporter.id,
                name=dd[0],
                phone=dd[1],
                license_number=dd[2],
                license_expiry=datetime.now(timezone.utc) + timedelta(days=365 * 2),
                is_active=True,
            )
            db.add(driver)

    db.flush()

    # =================== Routes ===================
    routes_data = [
        ("Mumbai", "Delhi", 1420, 24, "MUM-DEL"),
        ("Mumbai", "Pune", 150, 3, "MUM-PUN"),
        ("Delhi", "Jaipur", 280, 5, "DEL-JAI"),
        ("Hyderabad", "Bangalore", 570, 9, "HYD-BLR"),
        ("Lucknow", "Kanpur", 80, 1.5, "LKO-KNP"),
        ("Chennai", "Coimbatore", 500, 8, "CHN-CBE"),
        ("Ahmedabad", "Mumbai", 530, 8, "AMD-MUM"),
        ("Ludhiana", "Delhi", 310, 5, "LDH-DEL"),
        ("Kolkata", "Patna", 600, 10, "KOL-PAT"),
        ("Pune", "Nashik", 210, 4, "PUN-NSK"),
    ]

    for rd in routes_data:
        route = Route(origin=rd[0], destination=rd[1], distance_km=rd[2], estimated_hours=rd[3], route_code=rd[4])
        db.add(route)

    # =================== Materials ===================
    materials_data = [
        ("Steel Coils", "Metals", "MT", "7208"),
        ("Cement Bags", "Construction", "MT", "2523"),
        ("Rice Bags", "Food Grains", "MT", "1006"),
        ("Electronic Components", "Electronics", "Box", "8542"),
        ("FMCG Products", "Consumer Goods", "Carton", "3401"),
        ("Automobile Parts", "Automotive", "Box", "8708"),
        ("Chemicals", "Chemicals", "Drum", "2901"),
        ("Textile Rolls", "Textiles", "Roll", "5208"),
        ("Pharma Products", "Pharmaceutical", "Carton", "3004"),
        ("Machinery Parts", "Heavy Equipment", "Piece", "8431"),
    ]

    for md in materials_data:
        material = Material(name=md[0], category=md[1], unit=md[2], hsn_code=md[3])
        db.add(material)

    # =================== Branches ===================
    branches_data = [
        ("Mumbai HQ", "MUM-HQ", "Mumbai", "Maharashtra"),
        ("Delhi Branch", "DEL-BR", "New Delhi", "Delhi"),
        ("Hyderabad Branch", "HYD-BR", "Hyderabad", "Telangana"),
        ("Chennai Branch", "CHN-BR", "Chennai", "Tamil Nadu"),
        ("Kolkata Branch", "KOL-BR", "Kolkata", "West Bengal"),
    ]

    for bd in branches_data:
        branch = Branch(name=bd[0], branch_code=bd[1], city=bd[2], state=bd[3], is_active=True)
        db.add(branch)

    # =================== Customers ===================
    customers_data = [
        ("Tata Steel Ltd.", "CUST-001", "Rakesh Mehta", "procurement@tatasteel.com"),
        ("UltraTech Cement", "CUST-002", "Anil Kumar", "logistics@ultratech.com"),
        ("ITC Limited", "CUST-003", "Sanjay Verma", "supply@itc.in"),
        ("Maruti Suzuki", "CUST-004", "Pankaj Gupta", "parts@marutisuzuki.com"),
        ("Hindustan Unilever", "CUST-005", "Neha Sharma", "procurement@hul.co.in"),
    ]

    for cd in customers_data:
        customer = Customer(name=cd[0], customer_code=cd[1], contact_person=cd[2], email=cd[3])
        db.add(customer)

    db.flush()

    # =================== Auctions ===================
    now = datetime.now(timezone.utc)

    auction_configs = [
        {
            "pickup": "Mumbai, Maharashtra", "dest": "Delhi, NCR",
            "dist": 1420, "vehicle": "Tata LPT 1613", "capacity": "16 MT",
            "material": "Steel Coils", "weight": 15.0,
            "loading": now + timedelta(days=3), "closing": now + timedelta(hours=48),
            "reserve": 85000, "status": "live",
            "instructions": "Heavy load. Ensure proper strapping. Tarpaulin cover mandatory.",
        },
        {
            "pickup": "Pune, Maharashtra", "dest": "Nashik, Maharashtra",
            "dist": 210, "vehicle": "Eicher Pro 1110", "capacity": "5 MT",
            "material": "FMCG Products", "weight": 4.5,
            "loading": now + timedelta(days=2), "closing": now + timedelta(hours=24),
            "reserve": 18000, "status": "live",
            "instructions": "Handle with care. Temperature sensitive goods.",
        },
        {
            "pickup": "Delhi, NCR", "dest": "Jaipur, Rajasthan",
            "dist": 280, "vehicle": "Tata 407", "capacity": "3.5 MT",
            "material": "Electronic Components", "weight": 2.0,
            "loading": now + timedelta(days=1), "closing": now - timedelta(hours=2),
            "reserve": 15000, "status": "closed",
            "instructions": "Fragile items. GPS tracking required.",
        },
        {
            "pickup": "Hyderabad, Telangana", "dest": "Bangalore, Karnataka",
            "dist": 570, "vehicle": "Bharat Benz 1217", "capacity": "12 MT",
            "material": "Cement Bags", "weight": 11.0,
            "loading": now + timedelta(days=5), "closing": now + timedelta(hours=72),
            "reserve": 35000, "status": "published",
            "instructions": "Keep dry. Covered vehicle mandatory.",
        },
        {
            "pickup": "Ludhiana, Punjab", "dest": "Delhi, NCR",
            "dist": 310, "vehicle": "Tata Prima 4928", "capacity": "25 MT",
            "material": "Textile Rolls", "weight": 20.0,
            "loading": now - timedelta(days=5), "closing": now - timedelta(days=4),
            "reserve": 45000, "status": "awarded",
            "instructions": "Protect from moisture. Indoor loading.",
        },
    ]

    created_auctions = []
    for i, ac in enumerate(auction_configs):
        auction = Auction(
            auction_number=f"AUC-{now.strftime('%Y%m%d')}-{1001 + i}",
            created_by=admin.id,
            pickup_location=ac["pickup"],
            destination=ac["dest"],
            distance_km=ac["dist"],
            vehicle_type=ac["vehicle"],
            vehicle_capacity=ac["capacity"],
            material_type=ac["material"],
            expected_weight=ac["weight"],
            loading_date=ac["loading"],
            reporting_time="08:00",
            closing_time=ac["closing"],
            reserve_price=ac["reserve"],
            special_instructions=ac["instructions"],
            terms_conditions="Standard TRAMS terms and conditions apply. Payment within 30 days of delivery. Insurance covered by transporter.",
            status=ac["status"],
            auto_notify=True,
            start_time=now - timedelta(hours=i * 6),
        )
        db.add(auction)
        db.flush()
        created_auctions.append(auction)

        # Invite transporters
        for t in transporters:
            invite = AuctionInvite(
                auction_id=auction.id,
                transporter_id=t.id,
                status="participated" if ac["status"] in ("closed", "awarded", "live") else "invited",
            )
            db.add(invite)

    db.flush()

    # =================== Bids ===================
    bid_amounts = {
        0: [(78000, 1), (82000, 2), (75000, 1), (80000, 1), (77000, 2)],  # Live auction 1
        1: [(16500, 1), (17000, 1), (15800, 2), (16200, 1), (17500, 1)],  # Live auction 2
        2: [(13500, 2), (14000, 1), (12800, 1), (13200, 1), (14500, 1)],  # Closed auction
        4: [(42000, 1), (40000, 2), (38500, 1), (41000, 1), (39000, 1)],  # Awarded auction
    }

    for auction_idx, bids_for_auction in bid_amounts.items():
        auction = created_auctions[auction_idx]
        for t_idx, (amount, revisions) in enumerate(bids_for_auction):
            if t_idx >= len(transporters):
                break
            transporter = transporters[t_idx]

            bid = Bid(
                auction_id=auction.id,
                transporter_id=transporter.id,
                amount=amount,
                revision_number=revisions,
                is_latest=True,
                submitted_at=now - timedelta(hours=auction_idx * 3 + t_idx),
            )
            db.add(bid)
            db.flush()

            hist = BidHistory(
                bid_id=bid.id,
                old_amount=None if revisions == 1 else amount + 2000,
                new_amount=amount,
                revision_number=revisions,
            )
            db.add(hist)

            auction.total_bids += 1
            transporter.total_bids += 1

    db.flush()

    # =================== Award for closed auction ===================
    # Award auction index 4 (Awarded status)
    awarded_auction = created_auctions[4]
    winner_transporter = transporters[2]  # Gupta Roadways (lowest bid 38500)

    result = AuctionResult(
        auction_id=awarded_auction.id,
        winner_id=winner_transporter.id,
        awarded_by=admin.id,
        winning_amount=38500,
        award_status="auto_l1",
        remarks="Lowest bidder (L1) selected. Good track record.",
    )
    db.add(result)
    winner_transporter.total_wins += 1

    # =================== Notifications ===================
    for t in transporters:
        notif = Notification(
            user_id=t.user_id,
            title="Welcome to TRAMS",
            message=f"Welcome {t.company_name}! You are registered as a transporter. Complete your profile to start bidding.",
            type="system",
        )
        db.add(notif)

    notif_admin = Notification(
        user_id=admin.id,
        title="System Ready",
        message="TRAMS has been initialized with sample data. You can now create and manage auctions.",
        type="system",
    )
    db.add(notif_admin)

    db.commit()
    print("Database seeded with sample data successfully.")
    print("Admin login: admin@trams.in / Admin@123")
    print("Transporter login: transport1@demo.in / Transport@123")
