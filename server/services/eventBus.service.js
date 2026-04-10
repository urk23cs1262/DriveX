import { EventEmitter } from 'events';

/**
 * Global event bus for server events
 * Used to trigger SSE broadcasts when data changes
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners for SSE clients
  }
}

export const eventBus = new EventBus();

/**
 * Event types
 */
export const EVENT_TYPES = {
  // Node events
  NODE_STATUS_CHANGED: 'node:statusChanged',
  NODE_HEALTH_REFRESHED: 'node:healthRefreshed',

  // File events
  FILE_UPLOADED: 'file:uploaded',
  FILE_DELETED: 'file:deleted',
  FILE_REPLICATION_UPDATED: 'file:replicationUpdated',
};
