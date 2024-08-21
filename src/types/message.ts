type message_type = {
  success: boolean
  status?: number // use http err codes just cuz they easier
  message: string
  info?: {
    [key: string]: any;
  };
}

export type { message_type };