use axum::{routing::get, Router};
use forge_extensions_branch_templates::BranchTemplateService;
use forge_extensions_omni::OmniService;

pub fn build_router(_omni: OmniService, _branch_templates: BranchTemplateService) -> Router {
    Router::new().route("/health", get(healthcheck))
}

async fn healthcheck() -> &'static str {
    "ok"
}
