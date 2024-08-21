enum asset_types {
  // unfortunately roblox would like me to Name Things Like This.
  Image = 1,
  GIF = 1.5,
  TShirt = 2,
  Audio = 3,
  Mesh = 4,
  Lua = 5,
  /**
  * @deprecated
  */
  HTML = 6,
  /**
  * @deprecated
  */
  Text = 7,
  Hat = 8, // Legacy, newer versions would use *Accessory.
  Place = 9,
  Model = 10,
  Shirt = 11,
  Pants = 12,
  Decal = 13,
  /**
  * @custom
  */
  Thumbnail = 14, // CUSTOM!!!
  Head = 17,
  Face = 18,
  Gear = 19,
  Badge = 21,
  Animation = 24,
  Torso = 27,
  RightArm = 28,
  LeftArm = 29,
  LeftLeg = 30,
  RightLeg = 31,
  Package = 32,
  GamePass = 34,
  Plugin = 38,
  MeshPart = 40,
  // we would only REALLY need this for 2018
  HairAccessory = 41,
  FaceAccessory = 42,
  NeckAccessory = 43,
  ShoulderAccessory = 44,
  FrontAccessory = 45,
  BackAccessory = 46,
  WaistAccessory = 47,
  ClimbAnimation = 48,
  DeathAnimation = 49,
  FallAnimation = 50,
  IdleAnimation = 51,
  JumpAnimation = 52,
  RunAnimation = 53,
  SwimAnimation = 54,
  WalkAnimation = 55,
  PoseAnimation = 56,
  // beyond this point we don't really need this shit
  // EarAccessory = 57,
  // EyeAccessory = 58,
  // EmoteAnimation = 61,
  // Video = 62,
  // TShirtAccessory = 64,
  // ShirtAccessory = 65,
  // PantsAccessory = 66,
  // JacketAccessory = 67,
  // SweaterAccessory = 68,
  // ShortsAccessory = 69,
  // LeftShoeAccessory = 70,
  // RightShoeAccessory = 71,
  // DressSkirtAccessory = 72,
  FontFamily = 73,
  // EyebrowAccessory = 76,
  // EyelashAccessory = 77,
  // MoodAnimation = 78,
  // DynamicHead = 79
};

export { asset_types };