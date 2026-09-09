export interface Note {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  content: string;
  isDormant: boolean;
  firstReadAt: string | null;
  echoCount: number;
  createdAt: string;
  writtenWeather: string | null;
  writtenTime: string | null;
}

export interface User {
  id: string;
  email: string;
  pagesLeft: number;
  createdAt: string;
}
