use std::str::FromStr;

use sqlx::{Error, Pool, Sqlite, SqlitePool, sqlite::SqliteConnectOptions};
use utils::assets::asset_dir;

pub mod models;

#[derive(Clone)]
pub struct DBService {
    pub pool: Pool<Sqlite>,
}

impl DBService {
    pub async fn new() -> Result<DBService, Error> {
        let pool = Self::create_pool().await?;
        Ok(DBService { pool })
    }

    async fn create_pool() -> Result<Pool<Sqlite>, Error> {
        let database_url = format!(
            "sqlite://{}",
            asset_dir().join("db.sqlite").to_string_lossy()
        );
        let options = SqliteConnectOptions::from_str(&database_url)?.create_if_missing(true);
        let pool = SqlitePool::connect_with(options).await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        Ok(pool)
    }
}
