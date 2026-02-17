
import { ThingSpeakResponse, ThingSpeakFeed } from '../types';

const CHANNEL_ID = '3267441';
const READ_KEY = 'F32VD5KBS8RTBRBU';
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}`;

export const fetchLastFeed = async (): Promise<ThingSpeakFeed | null> => {
  try {
    const response = await fetch(`${BASE_URL}/feeds/last.json?api_key=${READ_KEY}`);
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    if (!data || !data.created_at) return null;
    return data;
  } catch (error) {
    return null;
  }
};

export const fetchHistory = async (results = 20): Promise<ThingSpeakFeed[]> => {
  try {
    const response = await fetch(`${BASE_URL}/feeds.json?results=${results}&api_key=${READ_KEY}`);
    if (!response.ok) throw new Error('API Error');
    const data: ThingSpeakResponse = await response.json();
    return data.feeds || [];
  } catch (error) {
    return [];
  }
};
