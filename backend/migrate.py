import logging
from sqlalchemy import text
from app.database import engine

logger = logging.getLogger(__name__)

def run_migration():
    """Ensure missing columns are added to existing SQLite database tables."""
    try:
        with engine.begin() as conn:
            # 1. users table
            user_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()}
            if "email" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users(email)"))
                logger.info("Migrated users table: added email column")

            # 2. orders table
            order_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(orders)")).fetchall()}
            if "courier" not in order_cols:
                conn.execute(text("ALTER TABLE orders ADD COLUMN courier VARCHAR(100) DEFAULT 'BlueDart Heritage Express'"))
            if "tracking_number" not in order_cols:
                conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) DEFAULT ''"))
            if "payment_method" not in order_cols:
                conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'mock_upi'"))
            if "upi_ref" not in order_cols:
                conn.execute(text("ALTER TABLE orders ADD COLUMN upi_ref VARCHAR(100) DEFAULT ''"))
    except Exception as e:
        logger.warning("Auto-migration check notice: %s", e)

if __name__ == "__main__":
    run_migration()
    print("Migration finished.")
