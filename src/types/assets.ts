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


export const asset_types_categorized = {
  catalog: {
    clothing: {
      TShirt: asset_types.TShirt,
      Hat: asset_types.Hat,
      Shirt: asset_types.Shirt,
      Pants: asset_types.Pants,
    },
    body_parts: {
      Head: asset_types.Head,
      Face: asset_types.Face,
      Torso: asset_types.Torso,
      RightArm: asset_types.RightArm,
      LeftArm: asset_types.LeftArm,
      LeftLeg: asset_types.LeftLeg,
      RightLeg: asset_types.RightLeg,
      Package: asset_types.Package,
    },
    animations: {
      ClimbAnimation: asset_types.ClimbAnimation,
      DeathAnimation: asset_types.DeathAnimation,
      FallAnimation: asset_types.FallAnimation,
      IdleAnimation: asset_types.IdleAnimation,
      JumpAnimation: asset_types.JumpAnimation,
      RunAnimation: asset_types.RunAnimation,
      SwimAnimation: asset_types.SwimAnimation,
      WalkAnimation: asset_types.WalkAnimation,
      PoseAnimation: asset_types.PoseAnimation,
    },
    accessories: {
      HairAccessory: asset_types.HairAccessory,
      FaceAccessory: asset_types.FaceAccessory,
      NeckAccessory: asset_types.NeckAccessory,
      ShoulderAccessory: asset_types.ShoulderAccessory,
      FrontAccessory: asset_types.FrontAccessory,
      BackAccessory: asset_types.BackAccessory,
      WaistAccessory: asset_types.WaistAccessory,
    },
    gear: {
      Gear: asset_types.Gear,
    },
  },
  library: {
    Audio: asset_types.Audio,
    Script: asset_types.Lua,
    Model: asset_types.Model,
    Decal: asset_types.Decal,
    Badge: asset_types.Badge,
    Animation: asset_types.Animation,
    Plugin: asset_types.Plugin,
  },
  generics: {
    Lua: asset_types.Lua,
    Image: asset_types.Image,
    Mesh: asset_types.Mesh,
    Place: asset_types.Place,
    Thumbnail: asset_types.Thumbnail,
    Gear: asset_types.Gear,
    GamePass: asset_types.GamePass,
    MeshPart: asset_types.MeshPart,
    FontFamily: asset_types.FontFamily,
  },
}

export { asset_types };