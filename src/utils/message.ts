type message_type = {
  success: boolean
  status?: number
  message: string
  info?: {
    [key: string]: any;
  };
}

export type { message_type };