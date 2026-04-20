-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: dashboard
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `changeoversummary`
--

DROP TABLE IF EXISTS `changeoversummary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `changeoversummary` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch` double NOT NULL,
  `recipe_change_time` datetime(6) DEFAULT NULL,
  `current_recipe` longtext,
  `previous_recipe` longtext,
  `ramp_down` datetime(6) DEFAULT NULL,
  `setup_start` datetime(6) DEFAULT NULL,
  `ramp_up` datetime(6) DEFAULT NULL,
  `setup_complete` datetime(6) DEFAULT NULL,
  `ramp_up_time_loss` double DEFAULT NULL,
  `ramp_down_time_loss` double DEFAULT NULL,
  `setup_time_act` double DEFAULT NULL,
  `standard_time` bigint DEFAULT NULL,
  `static_setup_time` double DEFAULT NULL,
  `ramp_up_time` double DEFAULT NULL,
  `current_type` longtext,
  `previous_type` longtext,
  `change_over` longtext,
  `overshoot_category` varchar(50) DEFAULT NULL,
  `overshoot_reason` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch` (`batch`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-20 23:19:42
