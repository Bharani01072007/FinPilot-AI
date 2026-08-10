import os
import sys
import psycopg2

def main():
    print("=" * 60)
    print("FinPilot AI — Supabase Database Migration & Seeding Tool")
    print("=" * 60)

    # DIRECT_URL for session-mode pooler (5432)
    direct_url = "postgresql://postgres.yyuwuvhjornynkzunirs:%409342393957@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

    sql_file_path = os.path.join(os.path.dirname(__file__), "supabase_master_seed.sql")

    if not os.path.exists(sql_file_path):
        print(f"Error: SQL file not found at {sql_file_path}")
        sys.exit(1)

    print(f"Reading SQL script: {sql_file_path}...")
    with open(sql_file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print("Connecting to Supabase PostgreSQL database via DIRECT_URL...")
    try:
        conn = psycopg2.connect(direct_url, connect_timeout=15)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully!")

        print("Executing Master Migration & Seeding Script...")
        cur.execute(sql_content)
        print("Master Migration & Seeding completed successfully!")

        # Quick Verification
        print("\nVerifying database tables and counts:")
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = cur.fetchall()
        print(f"Found {len(tables)} tables in public schema:")
        for t in tables:
            t_name = t[0]
            try:
                cur.execute(f"SELECT COUNT(*) FROM public.{t_name};")
                count = cur.fetchone()[0]
                print(f"  - public.{t_name}: {count} rows")
            except Exception as e:
                print(f"  - public.{t_name}: (could not count: {e})")

        cur.close()
        conn.close()
        print("\nAll database tables and auth users have been populated!")

    except Exception as err:
        print(f"\nError populating database: {err}")
        print("\nAlternative Method:")
        print("Copy the contents of 'supabase_master_seed.sql' into Supabase Dashboard -> SQL Editor and click RUN.")
        sys.exit(1)

if __name__ == "__main__":
    main()
