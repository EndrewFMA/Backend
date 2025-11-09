CREATE DATABASE  IF NOT EXISTS `auria` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `auria`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: auria
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `donations`
--

DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_group` int NOT NULL,
  `type` tinyint(1) NOT NULL,
  `quantity` double NOT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `proof` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `inserted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `score_fraud` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donations`
--

LOCK TABLES `donations` WRITE;
/*!40000 ALTER TABLE `donations` DISABLE KEYS */;
INSERT INTO `donations` VALUES (1,1,1,200,'4','uploads\\1762625899101-438026559.pdf','2025-11-08 03:00:00',1),(2,1,0,20,'4','uploads\\1762629026226-55126325.pdf','2025-11-08 03:00:00',1),(3,1,0,22.5,'4','uploads\\1762629230192-260001068.pdf','2025-11-08 03:00:00',1),(4,1,0,22.5,'5','uploads\\1762630065980-669830614.pdf','2025-11-08 03:00:00',1),(5,1,0,22.5,'5','uploads\\1762630097890-524892166.pdf','2025-11-08 03:00:00',1),(6,1,1,574.2,'7','uploads\\1762630227141-510583806.pdf','2025-11-08 03:00:00',1),(7,1,1,20,'5','uploads\\1762636239076-972577445.pdf','2025-11-08 03:00:00',1),(8,1,1,2,'5','uploads\\1762636344642-997532563.pdf','2025-11-08 03:00:00',1),(9,1,1,2.6,'5','uploads\\1762636550608-239519956.pdf','2025-11-08 03:00:00',1),(10,1,1,5.8,'5','uploads\\1762636802521-15216314.pdf','2025-11-08 03:00:00',1),(11,1,0,32.5,'8','uploads\\1762645704296-216987465.pdf','2025-11-08 03:00:00',1),(12,1,1,300,'5','uploads\\1762649747745-157415588.pdf','2025-11-09 03:00:00',1),(13,1,1,253.4,'7','uploads\\1762650449169-443312460.pdf','2025-11-09 03:00:00',1),(14,1,0,20,'4','uploads\\1762654488013-688895111.pdf','2025-11-09 03:00:00',1),(15,1,0,2.6,'5','uploads\\1762660689979-162238448.pdf','2025-11-09 03:00:00',1),(16,1,1,55.3,'5','uploads\\1762660741570-639184724.pdf','2025-11-09 03:00:00',1);
/*!40000 ALTER TABLE `donations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_outbox`
--

DROP TABLE IF EXISTS `email_outbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_outbox` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `from_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `to_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'E-mail do destinatÃ¡rio',
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Assunto do e-mail',
  `body_text` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'Corpo do e-mail em texto puro',
  `body_html` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'Corpo do e-mail em HTML',
  `sent_at` datetime DEFAULT NULL COMMENT 'Data/hora em que o e-mail foi enviado (NULL = ainda nÃ£o enviado)',
  `last_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'Mensagem de erro da Ãºltima tentativa de envio (se falhar)',
  `retries` int NOT NULL DEFAULT '0' COMMENT 'NÃºmero de tentativas de envio',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criaÃ§Ã£o do registro',
  PRIMARY KEY (`id`),
  KEY `idx_outbox_to_email` (`to_email`),
  KEY `idx_outbox_sent` (`sent_at`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_outbox`
--

LOCK TABLES `email_outbox` WRITE;
/*!40000 ALTER TABLE `email_outbox` DISABLE KEYS */;
INSERT INTO `email_outbox` VALUES (30,NULL,'rayssa.medeiros205@outlook.com','Convite para participar do grupo Auria','VocÃª foi convidado(a) como Colaborador. Para aceitar, acesse: http://localhost:5173/aceitar-convite?token=3118d5922bc7db75ad53807ef07de97a7be0091c67edce574d7347f52962351f','<p>VocÃª foi convidado(a) como <strong>Colaborador</strong>.</p>\n           <p><a href=\"http://localhost:5173/aceitar-convite?token=3118d5922bc7db75ad53807ef07de97a7be0091c67edce574d7347f52962351f\">Clique aqui para aceitar</a></p>','2025-10-29 22:10:51',NULL,0,'2025-10-30 01:10:47'),(31,NULL,'gustavolucas@gmail.com','Convite para participar do grupo Auria','VocÃª foi convidado(a) como Administrador. Para aceitar, acesse: http://localhost:5173/aceitar-convite?token=a155c7219c2858becc27f5342a9b2f7670ebd35bc3268af65fcf80cc7b097633','<p>VocÃª foi convidado(a) como <strong>Administrador</strong>.</p>\n           <p><a href=\"http://localhost:5173/aceitar-convite?token=a155c7219c2858becc27f5342a9b2f7670ebd35bc3268af65fcf80cc7b097633\">Clique aqui para aceitar</a></p>','2025-10-29 22:12:14',NULL,0,'2025-10-30 01:12:10'),(32,NULL,'luizantonio050206@gmail.com','Convite para participar do grupo Auria','VocÃª foi convidado(a) como Mentor. Para aceitar, acesse: http://localhost:5173/aceitar-convite?token=f03ddd0cdf445332c1ecbcad507b5bd3a66736342c9e94c7c8429525372605e0','<p>VocÃª foi convidado(a) como <strong>Mentor</strong>.</p>\n           <p><a href=\"http://localhost:5173/aceitar-convite?token=f03ddd0cdf445332c1ecbcad507b5bd3a66736342c9e94c7c8429525372605e0\">Clique aqui para aceitar</a></p>','2025-10-30 19:10:23',NULL,0,'2025-10-30 22:10:16'),(33,NULL,'david.lemes@fecap.br','Convite para participar do grupo Auria','VocÃª foi convidado(a) como Mentor. Para aceitar, acesse: http://localhost:5173/aceitar-convite?token=2b28e20d5ae35be9266815bb0b09ae892de218d1e85daca3f0e6771be02557cb','<p>VocÃª foi convidado(a) como <strong>Mentor</strong>.</p>\n           <p><a href=\"http://localhost:5173/aceitar-convite?token=2b28e20d5ae35be9266815bb0b09ae892de218d1e85daca3f0e6771be02557cb\">Clique aqui para aceitar</a></p>','2025-10-30 19:19:45',NULL,0,'2025-10-30 22:19:42');
/*!40000 ALTER TABLE `email_outbox` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `members` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `monetary_target` double NOT NULL,
  `food_goal` double NOT NULL,
  `current_food_collection` double NOT NULL DEFAULT '0',
  `current_money_collection` double NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,'Auria',5,'2025-11-09 04:50:30',5000,500,144.6,1413.3000000000002,1),(2,'Bool',7,'2025-11-09 14:22:49',3000,1000,0,0,1),(3,'Valle',8,'2025-11-09 14:23:30',1500,2400,120.3,0,1);
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitations`
--

DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Colaborador' COMMENT 'Mentor | Colaborador | Gestor | Administrador',
  `token_hash` varbinary(32) NOT NULL COMMENT 'SHA-256(token) em binÃ¡rio',
  `status` enum('pending','accepted','revoked','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `invited_by_user_id` int NOT NULL,
  `expires_at` datetime NOT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_pending` tinyint(1) GENERATED ALWAYS AS ((`status` = _utf8mb4'pending')) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invitation_one_pending_per_email_group` (`email`,`group_id`,`is_pending`),
  KEY `idx_inv_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitations`
--

LOCK TABLES `invitations` WRITE;
/*!40000 ALTER TABLE `invitations` DISABLE KEYS */;
INSERT INTO `invitations` (`id`, `group_id`, `email`, `role`, `token_hash`, `status`, `invited_by_user_id`, `expires_at`, `accepted_at`, `revoked_at`, `created_at`, `updated_at`) VALUES (32,1,'rayssa.medeiros205@outlook.com','Colaborador',_binary '¨´ÀÏìÐÎ\Z;«^Pg Uµ','pending',0,'2025-11-05 22:10:47',NULL,NULL,'2025-10-30 01:10:47','2025-10-30 01:10:47'),(33,1,'gustavolucas@gmail.com','Administrador',_binary '5gý|eÀ_I ®m%°8\nêY','pending',0,'2025-11-05 22:12:10',NULL,NULL,'2025-10-30 01:12:10','2025-10-30 01:12:10'),(34,1,'luizantonio050206@gmail.com','Mentor',_binary '@aü5±jnQ­ÖëYÚ2ïzÉ','pending',0,'2025-11-06 19:10:16',NULL,NULL,'2025-10-30 22:10:16','2025-10-30 22:10:16'),(35,1,'david.lemes@fecap.br','Mentor',_binary ',ÕK2© Åè÷LïGÃíG&à','pending',0,'2025-11-06 19:19:42',NULL,NULL,'2025-10-30 22:19:42','2025-10-30 22:19:42');
/*!40000 ALTER TABLE `invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('Mentor','Colaborador','Administrador') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Colaborador' COMMENT '0 = Administrator, 1 = Mentor, 2 = Member',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `current_money_collection` double NOT NULL DEFAULT '0',
  `current_food_collection` double NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,1,'Artur Loreto','loreto@teste.com','Mentor','$2b$10$Llv50Ojz8mp1tccDQqVREudbx1CW31E3WRqZcAUuuaGVyG8ASViVi','2025-09-20 20:22:23',200,62.5,1),(5,1,'Mariana Almeida','mariana@teste.com','Colaborador','$2b$10$Llv50Ojz8mp1tccDQqVREudbx1CW31E3WRqZcAUuuaGVyG8ASViVi','2025-09-21 06:21:17',385.7,47.6,1),(7,1,'Endrew Sobrenome','endrew@teste.com','Colaborador','$2b$10$Llv50Ojz8mp1tccDQqVREudbx1CW31E3WRqZcAUuuaGVyG8ASViVi','2025-09-21 16:44:52',827.6,0,1),(8,1,'Gustavo Archangelo','gustavo@teste.com','Administrador','$2b$10$Llv50Ojz8mp1tccDQqVREudbx1CW31E3WRqZcAUuuaGVyG8ASViVi','2025-10-11 18:49:25',0,32.5,1),(9,1,'Luis Gonzaga','luis@teste.com','Colaborador','$2b$10$Llv50Ojz8mp1tccDQqVREudbx1CW31E3WRqZcAUuuaGVyG8ASViVi','2025-10-11 18:49:25',0,2,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-09 13:55:33
