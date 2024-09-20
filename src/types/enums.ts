// global enums
import { asset_types, asset_types_categorized } from "./assets";
import { gender_types } from "./gender";
import { membership_perks, membership_types } from "./membership";
import { moderation_status_types } from "./moderation";
import { orderby_enum } from "./orderby";
import { privacy_types } from "./privacy";
import { privilege_types } from "./privileges";


// cant do "enum";
const ENUM = Object.freeze({
  assets: asset_types,
  assets_categorized: asset_types_categorized,
  gender: gender_types,
  membership: membership_types,
  membership_perks: membership_perks,
  moderation: moderation_status_types,
  order: orderby_enum,
  privacy: privacy_types,
  privileges: privilege_types,
});

export default ENUM;