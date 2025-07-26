use std::str::FromStr;

use sqlx::{Error, Pool, Sqlite, SqlitePool, sqlite::SqliteConnectOptions};

pub async fn start_db(database_url: &str) -> Result<Pool<Sqlite>, Error> {
    let options = SqliteConnectOptions::from_str(&database_url)?.create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}
