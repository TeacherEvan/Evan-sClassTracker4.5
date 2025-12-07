/**
 * Backward compatibility re-export
 * This file maintains the old import path for components that import from @/components/class-booking
 * The actual implementation is now in @/components/class-booking/index
 */
"use client";

import { ClassBooking } from './class-booking/index';

export default ClassBooking;
