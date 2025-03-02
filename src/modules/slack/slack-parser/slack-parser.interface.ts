/**
 * Interface for Slack User object from the export
 */
export interface SlackExportUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    image_original?: string;
    image_512?: string;
    image_192?: string;
    image_72?: string;
    display_name?: string;
    real_name?: string;
    title?: string;
    team?: string;
    phone?: string;
    [key: string]: any;
  };
  is_bot: boolean;
  deleted?: boolean;
  is_admin?: boolean;
  is_owner?: boolean;
  updated?: number;
  [key: string]: any;
}

/**
 * Interface for Slack Channel object from the export
 */
export interface SlackExportChannel {
  id: string;
  name: string;
  created: number;
  creator?: string;
  is_archived?: boolean;
  is_general?: boolean;
  members?: string[];
  topic?: {
    value: string;
    creator?: string;
    last_set?: number;
  };
  purpose?: {
    value: string;
    creator?: string;
    last_set?: number;
  };
  is_private: boolean;
  [key: string]: any;
}

/**
 * Interface for Slack File object from the export
 */
export interface SlackExportFile {
  id: string;
  created: number;
  timestamp: number;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  pretty_type: string;
  user: string;
  editable: boolean;
  size: number;
  mode: string;
  is_external: boolean;
  external_type: string;
  is_public: boolean;
  public_url_shared: boolean;
  display_as_bot: boolean;
  username: string;
  url_private: string;
  url_private_download: string;
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
  thumb_160?: string;
  thumb_720?: string;
  thumb_720_w?: number;
  thumb_720_h?: number;
  permalink: string;
  permalink_public: string;
  [key: string]: any;
}

/**
 * Interface for Slack Reaction object from the export
 */
export interface SlackExportReaction {
  name: string;
  users: string[];
  count: number;
}

/**
 * Interface for Slack Message object from the export
 */
export interface SlackExportMessage {
  client_msg_id?: string;
  type: string;
  user?: string;
  text: string;
  ts: string;
  team?: string;
  thread_ts?: string;
  parent_user_id?: string;
  reply_count?: number;
  reply_users_count?: number;
  reply_users?: string[];
  latest_reply?: string;
  reactions?: SlackExportReaction[];
  files?: SlackExportFile[];
  edited?: {
    user: string;
    ts: string;
  };
  is_locked?: boolean;
  subtype?: string;
  bot_id?: string;
  username?: string;
  [key: string]: any;
}

/**
 * Interface for the parsed content of a message
 */
export interface ParsedMessageContent {
  rawContent: string;
  plainContent: string;
  processedContent: string;
  mentionedUsers?: string[];
  mentionedChannels?: string[];
}

/**
 * Interface for a Slack export file structure
 */
export interface SlackExportStructure {
  users: SlackExportUser[];
  channels: SlackExportChannel[];
  channelMessages: Map<string, SlackExportMessage[]>;
}

/**
 * Interface for the parser's configuration
 */
export interface SlackParserConfig {
  exportPath: string;
  maxMessagesPerChannel?: number;
  ignoreOlderThan?: Date;
  includeDeleted?: boolean;
  includePrivateChannels?: boolean;
}

/**
 * Interface for parse results
 */
export interface ParseResult {
  usersProcessed: number;
  channelsProcessed: number;
  messagesProcessed: number;
  filesProcessed: number;
  errors: string[];
}