"""
Add business tables for monetization and admin functionality
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database.session import engine, get_db

def add_business_tables():
    """Add business tables via raw SQL"""
    
    with engine.connect() as conn:
        # Add columns to users table
        print("Adding columns to users table...")
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS plan_code VARCHAR(30) DEFAULT 'free',
            ADD COLUMN IF NOT EXISTS free_uses_used INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS free_uses_limit INT DEFAULT 5,
            ADD COLUMN IF NOT EXISTS monthly_debate_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS monthly_reset_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
        """))
        
        # Update role constraint
        conn.execute(text("""
            ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
        """))
        conn.execute(text("""
            ALTER TABLE users 
            ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'admin', 'super_admin'));
        """))
        
        # Create plans table
        print("Creating plans table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS plans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(30) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                price_usd_cents INT NOT NULL,
                currency VARCHAR(3) DEFAULT 'USD',
                interval VARCHAR(20) DEFAULT 'month',
                monthly_debate_limit INT,
                protected_apps_limit INT,
                features_json JSONB,
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # Create subscriptions table
        print("Creating subscriptions table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                plan_code VARCHAR(30) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                stripe_subscription_id VARCHAR(100),
                current_period_start TIMESTAMP,
                current_period_end TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
        """))
        
        # Create usage_logs table
        print("Creating usage_logs table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS usage_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                endpoint VARCHAR(100),
                debates INT DEFAULT 1,
                tokens INT,
                cost_usd DECIMAL(10, 6),
                created_at TIMESTAMP DEFAULT NOW()
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs(user_id, created_at);
        """))
        
        # Create settings table
        print("Creating settings table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(100) PRIMARY KEY,
                value_json JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        conn.commit()
        print("Business tables added successfully!")

if __name__ == "__main__":
    add_business_tables()
