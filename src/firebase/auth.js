import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, "users", cred.user.uid));
  if (!userDoc.exists()) {
    throw new Error("用户数据不存在，请联系管理员");
  }
  return { user: { id: cred.user.uid, ...userDoc.data() } };
}

export async function register(email, password, name, dept) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userData = {
    name,
    email,
    role: "staff",
    avatar: "👤",
    dept: dept || "",
    createdAt: new Date(),
  };
  await setDoc(doc(db, "users", cred.user.uid), userData);
  return { user: { id: cred.user.uid, ...userData } };
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        callback({ id: firebaseUser.uid, ...userDoc.data() });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
