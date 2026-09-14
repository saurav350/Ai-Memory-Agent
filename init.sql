-- =============================================================
-- AI Memory Agent - MySQL Database Initialization Script
-- =============================================================

CREATE DATABASE IF NOT EXISTS MemoryAgentDb;
USE MemoryAgentDb;

-- Create the Memories table
CREATE TABLE IF NOT EXISTS `Memories` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `Content` TEXT NOT NULL,
    `Category` VARCHAR(100) NOT NULL DEFAULT 'General',
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`Id`),
    INDEX `IX_Memories_Category` (`Category`),
    INDEX `IX_Memories_CreatedAt` (`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed starter memories for initial testing and demonstration
INSERT INTO `Memories` (`Content`, `Category`, `CreatedAt`) VALUES
('Built the ASP.NET Core Web API backend with Pomelo EF Core MySQL provider and Gemini 1.5 Flash AI summarization.', 'Work', UTC_TIMESTAMP()),
('Explored modern prompt structuring techniques for summarizing personal notes and memories.', 'Learning', UTC_TIMESTAMP()),
('Reflected on monthly accomplishments and scheduled focus blocks for creative learning.', 'Personal', UTC_TIMESTAMP()),
('Idea: Implement tag clustering and automatic emotion/mood detection for stored notes.', 'Ideas', UTC_TIMESTAMP());
