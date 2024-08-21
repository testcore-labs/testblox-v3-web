enum privacy_types {
  PRIVATE, 
  PUBLIC, 
  UNLISTED // not a real roblox feature but i felt like adding it
};

export function validate_privacy(int: number): privacy_types {
  switch (int) {
    case privacy_types.PRIVATE:
      return privacy_types.PRIVATE;
    case privacy_types.PUBLIC:
      return privacy_types.PUBLIC;
    case privacy_types.UNLISTED:
      return privacy_types.UNLISTED;
    default:
      return privacy_types.PRIVATE;
  }
}

export { privacy_types };