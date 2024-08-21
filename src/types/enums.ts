// global enums
import { asset_types } from "./assets";
import { gender_types } from "./gender";
import { membership_perks, membership_types } from "./membership";
import { moderation_status_types } from "./moderation";
import { orderby_enum } from "./orderby";
import { privacy_types } from "./privacy";
import { privelege_types } from "./priveleges";


// cant do "enum";
const ENUM = Object.freeze({
  assets: asset_types,
  gender: gender_types,
  membership: membership_types,
  membership_perks: membership_perks,
  moderation: moderation_status_types,
  order: orderby_enum,
  privacy: privacy_types,
  priveleges: privelege_types,
});

export default ENUM;