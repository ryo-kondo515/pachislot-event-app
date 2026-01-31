CREATE TABLE `actors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actors_id` PRIMARY KEY(`id`),
	CONSTRAINT `actors_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`actorId` int,
	`eventDate` timestamp NOT NULL,
	`hotLevel` int NOT NULL,
	`machineType` varchar(255),
	`description` text,
	`sourceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(20) NOT NULL,
	`longitude` varchar(20) NOT NULL,
	`area` varchar(100) NOT NULL,
	`machineCount` int NOT NULL,
	`openingTime` varchar(10),
	`closingTime` varchar(10),
	`isPremium` int NOT NULL DEFAULT 0,
	`sourceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
