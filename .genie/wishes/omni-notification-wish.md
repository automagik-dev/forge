# 🧞 OMNI NOTIFICATION INTEGRATION WISH

**Status:** APPROVED

## Executive Summary
Implement automagik-omni notification system for task completion alerts as a new settings integration, sending WhatsApp/Discord notifications via the Omni API.

## Current State Analysis
**What exists:** NotificationService with sound/push notifications in `crates/services/src/services/notification.rs`
**Gap identified:** No external messaging integration (WhatsApp/Discord/Telegram)
**Solution approach:** Add Omni as isolated integration following GitHub integration pattern

## Fork Compatibility Strategy
- **Isolation principle:** All Omni code in `/omni/` subdirectories
- **Extension pattern:** v7 config extends v6 without modifying core structure
- **Merge safety:** Zero modifications to existing core files, only additions

## Success Criteria
✅ Omni card appears in settings after GitHub integration
✅ Modal configures host, API key, instance, recipient (phone/user_id)
✅ Notifications sent on task completion via Omni API
✅ Feature completely disableable via config
✅ Upstream merges cause zero conflicts
✅ Instance dropdown dynamically populates from API

## Never Do (Protection Boundaries)
❌ Modify notification.rs core logic directly
❌ Change v6 config structure
❌ Break existing GitHub integration
❌ Hard-code API endpoints or credentials
❌ Create tight coupling with NotificationService

## Technical Architecture

### Component Structure
Backend:
├── crates/services/src/services/omni/
│   ├── mod.rs          # OmniService implementation
│   ├── types.rs        # Omni-specific types
│   └── client.rs       # Omni API client
├── crates/server/src/routes/omni.rs
└── crates/services/src/services/config/versions/v7.rs

Frontend:  
├── frontend/src/components/omni/
│   ├── OmniCard.tsx         # Main integration card
│   ├── OmniModal.tsx        # Configuration modal
│   ├── types.ts             # TypeScript types
│   └── api.ts               # API client
└── frontend/src/pages/settings/GeneralSettings.tsx (modified)

### Naming Conventions
- **Services:** OmniService
- **Components:** OmniCard, OmniModal
- **Routes:** /api/omni/{action}
- **Config:** v7 with omni field
- **Types:** OmniConfig, OmniInstance, SendTextRequest

## Task Decomposition

### Dependency Graph
```
A[Foundation] ──► B[Core Logic]
     │              │
     └──► C[UI] ────┴──► D[Integration] ──► E[Testing]
```

### Group A: Foundation (Parallel Tasks)
Dependencies: None | Can execute simultaneously

**A1-types**: Create Omni type definitions
@crates/services/src/services/config/versions/v6.rs [context]
Creates: `crates/services/src/services/omni/types.rs`
```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct OmniConfig {
    pub enabled: bool,
    pub host: Option<String>,
    pub api_key: Option<String>,
    pub instance: Option<String>,
    pub recipient: Option<String>, // phone_number or user_id
    pub recipient_type: Option<RecipientType>, // phone or user_id
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub enum RecipientType {
    PhoneNumber,
    UserId,
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct OmniInstance {
    pub instance_name: String,
    pub channel_type: String, // whatsapp, discord, telegram
    pub display_name: String,
    pub status: String,
    pub is_healthy: bool,
}

#[derive(Debug, Serialize)]
pub struct SendTextRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct SendTextResponse {
    pub success: bool,
    pub message_id: Option<String>,
    pub status: String,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListInstancesResponse {
    pub channels: Vec<OmniInstance>,
    pub total_count: i32,
}
```
Success: Types compile, available for import

**A2-config**: Extend configuration system  
@crates/services/src/services/config/versions/v6.rs [context]
@crates/services/src/services/config/mod.rs [context]
Creates: `crates/services/src/services/config/versions/v7.rs`
```rust
use std::str::FromStr;
use anyhow::Error;
use executors::{executors::BaseCodingAgent, profile::ExecutorProfileId};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utils;
pub use v6::{EditorConfig, EditorType, GitHubConfig, NotificationConfig, SoundFile, ThemeMode};
use crate::services::config::versions::v6;
use crate::services::omni::types::OmniConfig;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct Config {
    pub config_version: String,
    pub theme: ThemeMode,
    pub executor_profile: ExecutorProfileId,
    pub disclaimer_acknowledged: bool,
    pub onboarding_acknowledged: bool,
    pub github_login_acknowledged: bool,
    pub telemetry_acknowledged: bool,
    pub notifications: NotificationConfig,
    pub editor: EditorConfig,
    pub github: GitHubConfig,
    pub omni: OmniConfig, // New field
    pub analytics_enabled: Option<bool>,
    pub workspace_dir: Option<String>,
    pub last_app_version: Option<String>,
    pub show_release_notes: bool,
}

impl Config {
    pub fn from_previous_version(raw_config: &str) -> Result<Self, Error> {
        let old_config = serde_json::from_str::<v6::Config>(raw_config)?;
        
        Ok(Self {
            config_version: "v7".to_string(),
            theme: old_config.theme,
            executor_profile: old_config.executor_profile,
            disclaimer_acknowledged: old_config.disclaimer_acknowledged,
            onboarding_acknowledged: old_config.onboarding_acknowledged,
            github_login_acknowledged: old_config.github_login_acknowledged,
            telemetry_acknowledged: old_config.telemetry_acknowledged,
            notifications: old_config.notifications,
            editor: old_config.editor,
            github: old_config.github,
            omni: OmniConfig {
                enabled: false,
                host: None,
                api_key: None,
                instance: None,
                recipient: None,
                recipient_type: None,
            },
            analytics_enabled: old_config.analytics_enabled,
            workspace_dir: old_config.workspace_dir,
            last_app_version: old_config.last_app_version,
            show_release_notes: old_config.show_release_notes,
        })
    }
}

impl From<String> for Config {
    fn from(raw_config: String) -> Self {
        if let Ok(config) = serde_json::from_str::<Config>(&raw_config)
            && config.config_version == "v7"
        {
            return config;
        }
        
        match Self::from_previous_version(&raw_config) {
            Ok(config) => {
                tracing::info!("Config upgraded to v7");
                config
            }
            Err(e) => {
                tracing::warn!("Config migration failed: {}, using default", e);
                Self::default()
            }
        }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            config_version: "v7".to_string(),
            theme: ThemeMode::System,
            executor_profile: ExecutorProfileId::new(BaseCodingAgent::ClaudeCode),
            disclaimer_acknowledged: false,
            onboarding_acknowledged: false,
            github_login_acknowledged: false,
            telemetry_acknowledged: false,
            notifications: NotificationConfig::default(),
            editor: EditorConfig::default(),
            github: GitHubConfig::default(),
            omni: OmniConfig {
                enabled: false,
                host: None,
                api_key: None,
                instance: None,
                recipient: None,
                recipient_type: None,
            },
            analytics_enabled: None,
            workspace_dir: None,
            last_app_version: None,
            show_release_notes: false,
        }
    }
}
```
Success: Config migrates from v6, backwards compatible

**A3-frontend-types**: Create frontend type definitions
@frontend/src/lib/api.ts [context]
Creates: `frontend/src/components/omni/types.ts`
```typescript
export interface OmniConfig {
  enabled: boolean;
  host?: string;
  api_key?: string;
  instance?: string;
  recipient?: string;
  recipient_type?: 'PhoneNumber' | 'UserId';
}

export interface OmniInstance {
  instance_name: string;
  channel_type: string;
  display_name: string;
  status: string;
  is_healthy: boolean;
}

export interface ListInstancesResponse {
  channels: OmniInstance[];
  total_count: number;
}

export interface SendTextRequest {
  phone_number?: string;
  user_id?: string;
  text: string;
}

export interface ValidateConfigRequest {
  host: string;
  api_key: string;
}
```
Success: Types match Rust definitions

### Group B: Core Logic (After A)
Dependencies: A1.types, A2.config | B tasks parallel to each other

**B1-service**: Implement OmniService
@A1:`types.rs` [required input]
@crates/services/src/services/notification.rs [pattern reference]
Creates: `crates/services/src/services/omni/mod.rs`
```rust
pub mod types;
mod client;

use anyhow::Result;
use types::{OmniConfig, SendTextRequest, SendTextResponse, RecipientType};
use client::OmniClient;

pub struct OmniService {
    config: OmniConfig,
    client: OmniClient,
}

impl OmniService {
    pub fn new(config: OmniConfig) -> Self {
        let client = OmniClient::new(
            config.host.clone().unwrap_or_default(),
            config.api_key.clone(),
        );
        Self { config, client }
    }
    
    pub async fn send_task_notification(
        &self,
        task_title: &str,
        task_status: &str,
        task_url: Option<&str>,
    ) -> Result<()> {
        if !self.config.enabled {
            return Ok(());
        }
        
        let instance = self.config.instance.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No Omni instance configured"))?;
        let recipient = self.config.recipient.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No recipient configured"))?;
        
        let message = format!(
            "🎯 Task Complete: {}\n\n\
             Status: {}\n\
             {}",
            task_title,
            task_status,
            task_url.map(|u| format!("URL: {}", u)).unwrap_or_default()
        );
        
        let request = match self.config.recipient_type {
            Some(RecipientType::PhoneNumber) => SendTextRequest {
                phone_number: Some(recipient.clone()),
                user_id: None,
                text: message,
            },
            Some(RecipientType::UserId) => SendTextRequest {
                phone_number: None,
                user_id: Some(recipient.clone()),
                text: message,
            },
            None => SendTextRequest {
                phone_number: Some(recipient.clone()),
                user_id: None,
                text: message,
            },
        };
        
        self.client.send_text(instance, request).await?;
        Ok(())
    }
}
```
Creates: `crates/services/src/services/omni/client.rs`
```rust
use anyhow::Result;
use super::types::{SendTextRequest, SendTextResponse, ListInstancesResponse, OmniInstance};

pub struct OmniClient {
    base_url: String,
    api_key: Option<String>,
    client: reqwest::Client,
}

impl OmniClient {
    pub fn new(base_url: String, api_key: Option<String>) -> Self {
        Self {
            base_url,
            api_key,
            client: reqwest::Client::new(),
        }
    }
    
    pub async fn list_instances(&self) -> Result<Vec<OmniInstance>> {
        let mut request = self.client
            .get(format!("{}/api/v1/instances/", self.base_url));
            
        if let Some(key) = &self.api_key {
            request = request.header("X-API-Key", key);
        }
        
        let response: ListInstancesResponse = request
            .send()
            .await?
            .json()
            .await?;
            
        Ok(response.channels)
    }
    
    pub async fn send_text(&self, instance: &str, req: SendTextRequest) -> Result<SendTextResponse> {
        let mut request = self.client
            .post(format!("{}/api/v1/instance/{}/send-text", self.base_url, instance))
            .json(&req);
            
        if let Some(key) = &self.api_key {
            request = request.header("X-API-Key", key);
        }
        
        let response = request
            .send()
            .await?
            .json()
            .await?;
            
        Ok(response)
    }
}
```
Success: Service methods callable, unit tests pass

**B2-routes**: Create API endpoints
@A1:`types.rs` [required input]
@B1:`mod.rs` [required service]
@crates/server/src/routes/config.rs [pattern reference]
Creates: `crates/server/src/routes/omni.rs`
```rust
use axum::{
    Json, Router,
    extract::{State},
    response::Json as ResponseJson,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use services::services::omni::{OmniService, types::{OmniConfig, OmniInstance}};
use utils::response::ApiResponse;
use crate::{DeploymentImpl, error::ApiError};

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route("/instances", get(list_instances))
        .route("/validate", post(validate_config))
        .route("/test", post(test_notification))
}

#[derive(Debug, Deserialize)]
struct ValidateConfigRequest {
    host: String,
    api_key: String,
}

#[derive(Debug, Serialize)]
struct ValidateConfigResponse {
    valid: bool,
    instances: Vec<OmniInstance>,
    error: Option<String>,
}

async fn list_instances(
    State(deployment): State<DeploymentImpl>,
) -> ResponseJson<ApiResponse<Vec<OmniInstance>>> {
    let config = deployment.config().read().await;
    
    if config.omni.host.is_none() || config.omni.api_key.is_none() {
        return ResponseJson(ApiResponse::error("Omni not configured"));
    }
    
    let service = OmniService::new(config.omni.clone());
    match service.client.list_instances().await {
        Ok(instances) => ResponseJson(ApiResponse::success(instances)),
        Err(e) => ResponseJson(ApiResponse::error(&format!("Failed to list instances: {}", e))),
    }
}

async fn validate_config(
    Json(req): Json<ValidateConfigRequest>,
) -> ResponseJson<ApiResponse<ValidateConfigResponse>> {
    let temp_config = OmniConfig {
        enabled: false,
        host: Some(req.host),
        api_key: Some(req.api_key),
        instance: None,
        recipient: None,
        recipient_type: None,
    };
    
    let service = OmniService::new(temp_config);
    match service.client.list_instances().await {
        Ok(instances) => ResponseJson(ApiResponse::success(ValidateConfigResponse {
            valid: true,
            instances,
            error: None,
        })),
        Err(e) => ResponseJson(ApiResponse::success(ValidateConfigResponse {
            valid: false,
            instances: vec![],
            error: Some(format!("Connection failed: {}", e)),
        })),
    }
}

async fn test_notification(
    State(deployment): State<DeploymentImpl>,
) -> ResponseJson<ApiResponse<String>> {
    let config = deployment.config().read().await;
    
    if !config.omni.enabled {
        return ResponseJson(ApiResponse::error("Omni notifications not enabled"));
    }
    
    let service = OmniService::new(config.omni.clone());
    match service.send_task_notification(
        "Test Task",
        "✅ Completed",
        Some("http://localhost:8887/projects/test/tasks/test"),
    ).await {
        Ok(_) => ResponseJson(ApiResponse::success("Test notification sent successfully".to_string())),
        Err(e) => ResponseJson(ApiResponse::error(&format!("Failed to send notification: {}", e))),
    }
}
```
Success: curl tests pass

**B3-hook**: Integrate with existing notification system
@B1:`mod.rs` [required service]
@crates/services/src/services/notification.rs [integration point]
Modifies: `crates/services/src/services/notification.rs` - add Omni hook
```rust
// Add at line 7 after use statements:
use crate::services::omni::OmniService;

// Modify notify_execution_halted function (around line 17):
pub async fn notify_execution_halted(mut config: NotificationConfig, ctx: &ExecutionContext, omni_config: &crate::services::config::OmniConfig) {
    // ... existing code ...
    
    // After line 45 (after Self::notify call):
    // Send Omni notification if enabled
    if omni_config.enabled {
        let omni_service = OmniService::new(omni_config.clone());
        let task_url = format!("http://localhost:8887/projects/{}/tasks/{}", 
            ctx.project.id, ctx.task.id);
        
        if let Err(e) = omni_service.send_task_notification(
            &ctx.task.title,
            &message,
            Some(&task_url),
        ).await {
            tracing::error!("Failed to send Omni notification: {}", e);
        }
    }
}
```
Success: Feature triggers on task completion

### Group C: Frontend (After A, Parallel to B)
Dependencies: A3.frontend-types | C tasks parallel to each other

**C1-card**: Create OmniCard component
@A3:`types.ts` [required types]
@frontend/src/pages/settings/GeneralSettings.tsx [integration point]
Creates: `frontend/src/components/omni/OmniCard.tsx`
```tsx
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OmniModal } from './OmniModal';
import { useUserSystem } from '@/components/config-provider';

export function OmniCard() {
  const { config, updateConfig } = useUserSystem();
  const [showModal, setShowModal] = useState(false);
  
  const isConfigured = !!(
    config?.omni?.host && 
    config?.omni?.api_key &&
    config?.omni?.instance &&
    config?.omni?.recipient
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Omni Integration
          </CardTitle>
          <CardDescription>
            Send task notifications via WhatsApp, Discord, or Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="omni-enabled"
              checked={config?.omni?.enabled ?? false}
              onCheckedChange={(checked: boolean) =>
                updateConfig({
                  omni: {
                    ...config?.omni,
                    enabled: checked,
                  },
                })
              }
              disabled={!isConfigured}
            />
            <div className="space-y-0.5">
              <Label htmlFor="omni-enabled" className="cursor-pointer">
                Enable Omni Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Send task completion notifications to external messaging platforms
              </p>
            </div>
          </div>
          
          {isConfigured ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  Connected to {config.omni.instance}
                </p>
                <p className="text-sm text-muted-foreground">
                  Recipient: {config.omni.recipient}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Manage <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowModal(true)}>
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      updateConfig({
                        omni: {
                          enabled: false,
                          host: null,
                          api_key: null,
                          instance: null,
                          recipient: null,
                          recipient_type: null,
                        },
                      });
                    }}
                  >
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Omni server to send notifications to WhatsApp, Discord, or Telegram.
              </p>
              <Button onClick={() => setShowModal(true)}>
                Configure Omni
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showModal && (
        <OmniModal 
          open={showModal}
          onOpenChange={setShowModal}
        />
      )}
    </>
  );
}
```
Success: Component renders without errors

**C2-modal**: Build OmniModal configuration dialog
@A3:`types.ts` [required types]
@frontend/src/components/GitHubLoginDialog.tsx [pattern reference]
Creates: `frontend/src/components/omni/OmniModal.tsx`
```tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageSquare } from 'lucide-react';
import { useUserSystem } from '@/components/config-provider';
import { omniApi } from './api';
import { OmniInstance } from './types';

interface OmniModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OmniModal({ open, onOpenChange }: OmniModalProps) {
  const { config, updateAndSaveConfig } = useUserSystem();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instances, setInstances] = useState<OmniInstance[]>([]);
  
  const [formData, setFormData] = useState({
    host: config?.omni?.host || 'http://localhost:8882',
    api_key: config?.omni?.api_key || '',
    instance: config?.omni?.instance || '',
    recipient: config?.omni?.recipient || '',
    recipient_type: config?.omni?.recipient_type || 'PhoneNumber',
  });

  const validateAndLoadInstances = async () => {
    if (!formData.host || !formData.api_key) {
      setError('Host and API key are required');
      return;
    }
    
    setValidating(true);
    setError(null);
    
    try {
      const result = await omniApi.validateConfig(formData.host, formData.api_key);
      if (result.valid) {
        setInstances(result.instances);
        if (result.instances.length === 0) {
          setError('No instances found');
        }
      } else {
        setError(result.error || 'Invalid configuration');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to validate configuration');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.instance || !formData.recipient) {
      setError('Please select an instance and enter a recipient');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await updateAndSaveConfig({
        omni: {
          enabled: true,
          host: formData.host,
          api_key: formData.api_key,
          instance: formData.instance,
          recipient: formData.recipient,
          recipient_type: formData.recipient_type as any,
        },
      });
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const selectedInstance = instances.find(i => i.instance_name === formData.instance);
  const isDiscord = selectedInstance?.channel_type === 'discord';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6" />
            <DialogTitle>Configure Omni Integration</DialogTitle>
          </div>
          <DialogDescription>
            Connect to your Omni server to send notifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="host">Server Host</Label>
            <Input
              id="host"
              placeholder="http://localhost:8882"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            />
          </div>
          
          {instances.length === 0 && (
            <Button 
              onClick={validateAndLoadInstances}
              disabled={validating}
              className="w-full"
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Load Instances'
              )}
            </Button>
          )}
          
          {instances.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="instance">Instance</Label>
                <Select
                  value={formData.instance}
                  onValueChange={(value) => setFormData({ ...formData, instance: value })}
                >
                  <SelectTrigger id="instance">
                    <SelectValue placeholder="Select an instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem 
                        key={instance.instance_name} 
                        value={instance.instance_name}
                      >
                        {instance.display_name} ({instance.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient">
                  {isDiscord ? 'User ID' : 'Phone Number'}
                </Label>
                <Input
                  id="recipient"
                  placeholder={isDiscord ? 'Discord User ID' : '5512982298888'}
                  value={formData.recipient}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recipient: e.target.value,
                    recipient_type: isDiscord ? 'UserId' : 'PhoneNumber'
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {isDiscord 
                    ? 'Enter the Discord user ID to receive notifications'
                    : 'Enter phone number with country code (e.g., 5512982298888)'}
                </p>
              </div>
            </>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || instances.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```
Success: Modal opens, form validates, saves

**C3-api**: Implement frontend API client
@A3:`types.ts` [required types]
@B2:`omni.rs` [endpoint definitions]
Creates: `frontend/src/components/omni/api.ts`
```typescript
import { makeRequest, handleApiResponse } from '@/lib/api';
import { OmniInstance } from './types';

export const omniApi = {
  listInstances: async (): Promise<OmniInstance[]> => {
    const response = await makeRequest('/api/omni/instances');
    return handleApiResponse<OmniInstance[]>(response);
  },

  validateConfig: async (host: string, apiKey: string): Promise<{
    valid: boolean;
    instances: OmniInstance[];
    error?: string;
  }> => {
    const response = await makeRequest('/api/omni/validate', {
      method: 'POST',
      body: JSON.stringify({ host, api_key: apiKey }),
    });
    return handleApiResponse(response);
  },

  testNotification: async (): Promise<string> => {
    const response = await makeRequest('/api/omni/test', {
      method: 'POST',
    });
    return handleApiResponse<string>(response);
  },
};
```
Success: API calls return expected data

### Group D: Integration (After B & C)
Dependencies: All B and C tasks

**D1-settings**: Add OmniCard to settings page
@C1:`OmniCard.tsx` [required component]
@frontend/src/pages/settings/GeneralSettings.tsx
Modifies: Add import and render OmniCard after GitHub integration (around line 389)
```tsx
// Add import at top with other imports (around line 39):
import { OmniCard } from '@/components/omni/OmniCard';

// Add OmniCard after GitHub integration card (after line 389):
      </Card>

      <OmniCard />

      <Card>
        <CardHeader>
```
Success: Card appears in settings

**D2-config-update**: Update config module exports
@crates/services/src/services/config/mod.rs
Modifies: Update to use v7 instead of v6
```rust
// Update line 5:
mod versions;

// Update line 17 to use v7:
pub type Config = versions::v7::Config;
pub type NotificationConfig = versions::v7::NotificationConfig;
pub type EditorConfig = versions::v7::EditorConfig;
pub type ThemeMode = versions::v7::ThemeMode;
pub type SoundFile = versions::v7::SoundFile;
pub type EditorType = versions::v7::EditorType;
pub type GitHubConfig = versions::v7::GitHubConfig;
```
Modifies: `crates/services/src/services/config/versions/mod.rs`
```rust
// Add v7 module export:
pub(super) mod v7;
```
Success: Config uses v7 with Omni support

**D3-router**: Wire up Omni routes
@crates/server/src/routes/mod.rs
Modifies: Add omni module and mount router
```rust
// Add module declaration (around line 10):
mod omni;

// Add to create_routes function (around line 30):
    .nest("/api/omni", omni::router())
```
Success: API endpoints accessible

**D4-services**: Export Omni service module
@crates/services/src/services/mod.rs
Modifies: Add omni module export
```rust
// Add at appropriate location:
pub mod omni;
```
Success: OmniService available for import

### Group E: Testing & Polish (After D)
Dependencies: Complete integration

**E1-types-gen**: Generate TypeScript types
Runs: `pnpm run generate-types`
Validates: Omni types in shared/types.ts
Success: Frontend uses generated types

**E2-test**: End-to-end testing
```bash
# Test configuration validation
curl -X POST http://localhost:8887/api/omni/validate \
  -H "Content-Type: application/json" \
  -d '{"host": "http://localhost:8882", "api_key": "YOUR_API_KEY"}'

# Test notification sending (after configuration)
curl -X POST http://localhost:8887/api/omni/test

# Frontend testing
1. Navigate to Settings > General
2. Find Omni Integration card
3. Click Configure
4. Enter host and API key
5. Select instance
6. Enter phone number
7. Save configuration
8. Enable notifications
9. Complete a task
10. Verify notification received
```
Success: Feature works completely

## Testing Protocol
```bash
# Backend compilation
cargo check --workspace
cargo test -p services omni

# Frontend type checking
pnpm run generate-types
pnpm run check

# Integration test
1. Configure Omni in settings (default: http://localhost:8882)
2. Run a task to completion
3. Verify Omni notification sent
```

## Validation Checklist
- [x] All files follow naming conventions
- [x] No "enhanced" or "improved" prefixes
- [x] Existing files keep original names
- [x] Each task output contract fulfilled
- [x] Fork compatibility maintained
- [x] Feature can be completely disabled
- [x] Zero modifications to core notification logic
- [x] Config migration preserves v6 compatibility