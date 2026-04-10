import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDyuBJO_qD4eY-phDA11GXY_nMhwl_3yRo",
  authDomain: "nyama-42138.firebaseapp.com",
  projectId: "nyama-42138",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
