// universes is just like a container of places lmao
type universes_table = { 
  id: number
  placeid: number // main place id
  places?: {
    [key: number]: any;
  }
  creator: number

  updatedat: EpochTimeStamp
  createdat: EpochTimeStamp
};

export type { universes_table };
