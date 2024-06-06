type message_type = {
  success: boolean
  message: string
  info?: {
    [key: string]: any;
  };
}

export type { message_type };