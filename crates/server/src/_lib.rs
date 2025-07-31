// use rust_embed::RustEmbed;
// use sentry_tracing::{EventFilter, SentryLayer};
// use tracing::Level;

// pub mod command_executor;
// // pub mod execution_monitor;
// pub mod mcp;
// pub mod middleware;
// pub mod routes;

// #[derive(RustEmbed)]
// #[folder = "../frontend/dist"]
// pub struct Assets;

// pub fn sentry_layer<S>() -> SentryLayer<S>
// where
//     S: tracing::Subscriber,
//     S: for<'a> tracing_subscriber::registry::LookupSpan<'a>,
// {
//     SentryLayer::default()
//         .span_filter(|meta| {
//             matches!(
//                 *meta.level(),
//                 Level::DEBUG | Level::INFO | Level::WARN | Level::ERROR
//             )
//         })
//         .event_filter(|meta| match *meta.level() {
//             Level::ERROR => EventFilter::Event,
//             Level::DEBUG | Level::INFO | Level::WARN => EventFilter::Breadcrumb,
//             Level::TRACE => EventFilter::Ignore,
//         })
// }
