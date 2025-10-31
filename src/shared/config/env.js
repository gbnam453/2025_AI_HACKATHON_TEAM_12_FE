// src/shared/config/env.js
import { API_URL } from '@env';

export const API_BASE = (API_URL || '').trim().replace(/\/+$/, '');
