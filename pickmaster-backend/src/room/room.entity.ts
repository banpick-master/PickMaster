import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Defines the structure of the 'rooms' table in the PostgreSQL database
@Entity('rooms') // Specifies the table name
export class RoomEntity {
  @PrimaryColumn('uuid') // Uses 'roomId' as the primary key, expecting UUID format
  roomId: string;

  @CreateDateColumn() // Automatically records the creation timestamp
  createdAt: Date;

  @UpdateDateColumn() // Automatically records the last update timestamp
  updatedAt: Date;

  @Column() // Simple string column for the game name
  gameName: string;

  @Column() // Simple string column for the blue team name
  blueTeamName: string;

  @Column() // Simple string column for the red team name
  redTeamName: string;

  @Column() // Stores the game mode ('single', 'BO3', 'BO5')
  gameMode: string;

  @Column() // Stores the timer mode ('default', 'infinite')
  timerMode: string;

  @Column() // Stores the ban mode ('tournament', etc.)
  banMode: string;

  // Stores arrays/complex objects as JSONB for efficiency in PostgreSQL
  @Column('jsonb', { default: [] }) // Default value is an empty array
  blueTeamPlayers: any[]; // Consider defining a stricter type/interface later

  @Column('jsonb', { default: [] })
  redTeamPlayers: any[];

  @Column('jsonb', { default: [] })
  spectatorIds: string[];

  @Column({ default: 'idle' }) // Stores the ready check status with a default value
  readyCheckStatus: 'idle' | 'in-progress' | 'done' | 'all-ready';

  @Column({ default: 0 }) // Stores the current turn index, defaults to 0
  turnIndex: number;

  @Column('jsonb', { default: [] })
  blueBans: any[]; // Store ban information (e.g., champion objects)

  @Column('jsonb', { default: [] })
  redBans: any[];

  @Column('jsonb', { default: [] })
  bluePicks: any[]; // Store pick information (e.g., champion objects)

  @Column('jsonb', { default: [] })
  redPicks: any[];

  @Column('jsonb', { nullable: true, default: null }) // Allows null values, defaults to null
  swapRequest: any | null; // Store swap request details

  @Column('jsonb', { default: { games: [], currentGame: 1, blueWins: 0, redWins: 0 } }) // Complex object for game series state
  gameSeries: { games: any[]; currentGame: number; blueWins: number; redWins: number };

  @Column('jsonb', { default: [] }) // Stores champions picked across the series if fearless mode
  fearlessPicks: any[];

  @Column('jsonb', { default: {} }) // Stores socketId to playerId mapping
  playerMap: Record<string, string>;

  @Column({ type: 'varchar', nullable: true, default: null }) // Host player ID, can be null
  hostId: string | null;

  @Column({ default: false }) // Tracks if the draft phase has started
  draftStarted: boolean;

  @Column('jsonb', { nullable: true, default: null }) // Stores the champion currently being selected (temporary)
  currentSelection: any | null;

  @Column({ type: 'int', nullable: true })
  turnDuration: number | null;

  @Column({ type: 'bigint', nullable: true })
  turnEndTime: number | null;
}