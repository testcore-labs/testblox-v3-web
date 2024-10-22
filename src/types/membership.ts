import env from "../utils/env";

enum membership_types {
  NONE = 0, 
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,

  TIER_BETA = 4,
};

const membership_perks = {
  [membership_types.NONE]: {
    daily_currency: 20, 
    max_universes: 5,
  },
  [membership_types.TIER_1]: {
    daily_currency: 40, 
    max_universes: 10,
  },
  [membership_types.TIER_2]: {
    daily_currency: 60, 
    max_universes: 15,
  },
  [membership_types.TIER_3]: {
    daily_currency: 80, 
    max_universes: 30,
  },


  [membership_types.TIER_BETA]: {
    daily_currency: 50, 
    max_universes: 20,
  },
};

export { membership_types, membership_perks };