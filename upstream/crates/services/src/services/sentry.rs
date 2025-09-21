#[derive(Clone)]
pub struct SentryService {}

impl Default for SentryService {
    fn default() -> Self {
        Self::new()
    }
}

impl SentryService {
    pub fn new() -> Self {
        SentryService {}
    }

    pub async fn update_scope(&self, user_id: &str, username: Option<&str>, email: Option<&str>) {
        let sentry_user = match (username, email) {
            (Some(user), Some(email)) => sentry::User {
                id: Some(user_id.to_string()),
                username: Some(user.to_string()),
                email: Some(email.to_string()),
                ..Default::default()
            },
            _ => sentry::User {
                id: Some(user_id.to_string()),
                ..Default::default()
            },
        };

        sentry::configure_scope(|scope| {
            scope.set_user(Some(sentry_user));
        });
    }
}
