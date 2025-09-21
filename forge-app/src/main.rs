
use tracing_subscriber::fmt;

mod router;
mod services;

use router::create_router;

#[tokio::main]
async fn main() {
    fmt::init();

    let app = create_router();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8887")
        .await
        .expect("Failed to bind to 0.0.0.0:8887");

    println!("Forge app listening on http://0.0.0.0:8887");

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}