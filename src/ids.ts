import { customAlphabet } from 'nanoid';

const urlAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const newPollId = customAlphabet(urlAlphabet, 22);
export const newOptionId = customAlphabet(urlAlphabet, 16);
export const newAdminToken = customAlphabet(urlAlphabet, 32);
export const newSessionId = customAlphabet(urlAlphabet, 32);
