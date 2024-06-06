type user_table = { 
  id: number
  username: string
  password: string
  token: string
  status: string
  description: string

  currency: number // unnamed lols

  setup: boolean // shows options to set up your account once you register.
  locale: string // user decides
  language: string // user decides
  state: number // either 0: offline, 1: online, 2: playing, or 3: developing
  gender: number // 0: none, 1: male, 2: female
  membership: number // 0: None, 1: BuildersClub, 2: TurboBuildersClub, 3: OutrageousBuildersClub
  loginhistory: object // holds ips, useragents. optional
  moderationhistory: object // holds the time the account was banned and more

  online: EpochTimeStamp // only use if online
  updatedat: EpochTimeStamp
  createdat: EpochTimeStamp
};


export type { user_table };
