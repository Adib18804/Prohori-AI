"""
Seed business data: plans and make first user super_admin
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database.session import engine

def seed_business_data():
    """Seed plans and set first user as super_admin"""
    
    with engine.connect() as conn:
        # Insert plans if they don't exist
        print("Seeding plans...")
        
        plans = [
            ('free', 'Free', 0, 100, 1, '{"rag": true, "ml": false, "support": "community"}'),
            ('student', 'Student', 799, 2000, 1, '{"rag": true, "ml": true, "support": "email", "priority": "normal"}'),
            ('builder', 'Builder', 2900, 20000, 3, '{"rag": true, "ml": true, "support": "email + chat", "priority": "high", "custom_models": true}'),
            ('professional', 'Professional', 14900, 150000, -1, '{"rag": true, "ml": true, "support": "24/7 priority", "priority": "critical", "custom_models": true, "audit_logs": true, "sla": "99.9%"}'),
            ('enterprise', 'Enterprise', 0, -1, -1, '{"rag": true, "ml": true, "support": "dedicated", "priority": "critical", "custom_models": true, "audit_logs": true, "sla": "99.99%", "onprem": true, "custom_contract": true}')
        ]
        
        for idx, (code, name, price, limit, apps, features) in enumerate(plans):
            conn.execute(text("""
                INSERT INTO plans (code, name, price_usd_cents, monthly_debate_limit, protected_apps_limit, features_json, sort_order)
                VALUES (:code, :name, :price, :limit, :apps, CAST(:features AS jsonb), :sort)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    price_usd_cents = EXCLUDED.price_usd_cents,
                    monthly_debate_limit = EXCLUDED.monthly_debate_limit,
                    protected_apps_limit = EXCLUDED.protected_apps_limit,
                    features_json = EXCLUDED.features_json,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW();
            """), {
                'code': code,
                'name': name,
                'price': price,
                'limit': limit,
                'apps': apps,
                'features': features,
                'sort': idx
            })
        
        print("Plans seeded successfully!")
        
        # Make first registered user super_admin if no super_admin exists
        print("Checking for super_admin...")
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'super_admin'"))
        count = result.scalar()
        
        if count == 0:
            print("No super_admin found, promoting first user...")
            conn.execute(text("""
                UPDATE users 
                SET role = 'super_admin'
                WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
            """))
            result = conn.execute(text("""
                SELECT email FROM users WHERE role = 'super_admin' LIMIT 1;
            """))
            admin_email = result.scalar()
            if admin_email:
                print(f"Super admin set: {admin_email}")
            else:
                print("No users found to promote")
        else:
            print(f"Super admin already exists ({count} found)")
        
        # Insert default settings
        print("Seeding default settings...")
        settings = [
            ('free_uses_limit', '5'),
            ('enable_ml_classifier', 'false'),
            ('enable_rag_memory', 'true'),
            ('auto_block_threshold', '0.90'),
            ('debate_threshold', '0.70')
        ]
        
        for key, value in settings:
            conn.execute(text("""
                INSERT INTO settings (key, value_json)
                VALUES (:key, CAST(:value AS jsonb))
                ON CONFLICT (key) DO NOTHING;
            """), {'key': key, 'value': value})
        
        print("Settings seeded successfully!")
        
        conn.commit()
        print("Business data seeding complete!")

if __name__ == "__main__":
    seed_business_data()
