import multer from "multer";
import root_path from "./root_path";
import path from "path";

let multer_storage = multer({dest: path.join(root_path, "files", "tmp") });
export default multer_storage;