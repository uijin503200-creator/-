import { Redirect } from 'expo-router';

/** Legacy route — Drop now lives as a cinematic modal on the map home. */
export default function DropScreenRedirect() {
  return <Redirect href="/map" />;
}
