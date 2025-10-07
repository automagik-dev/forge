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

export interface SendTextRequest {
  phone_number?: string;
  user_id?: string;
  text: string;
}

export interface ValidateConfigRequest {
  host: string;
  api_key: string;
}
