use std::str::FromStr;

use sqlx::{Error, Pool, Sqlite, SqlitePool, sqlite::SqliteConnectOptions};

use crate::utils::assets::asset_dir;

pub async fn start_db() -> Result<Pool<Sqlite>, Error> {
    // Database connection
    let database_url = format!(
        "sqlite://{}",
        asset_dir().join("db.sqlite").to_string_lossy()
    );

    let options = SqliteConnectOptions::from_str(&database_url)?.create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}
