/*
 * Copyright © WebServices pour l'Éducation, 2014
 *
 * This file is part of ENT Core. ENT Core is a versatile ENT engine based on the JVM.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation (version 3 of the License).
 *
 * For the sake of explanation, any module that communicate over native
 * Web protocols, such as HTTP, with ENT Core is outside the scope of this
 * license and could be license under its own terms. This is merely considered
 * normal use of ENT Core, and does not fall under the heading of "covered work".
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package org.entcore.common.folders;

import fr.wseduc.webutils.Either;

import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public interface QuotaService {
	void notifySmallAmountOfFreeSpace(String userId);

	void incrementStorage(String userId, Long size, int threshold, Handler<Either<String, JsonObject>> handler);

	void decrementStorage(String userId, Long size, int threshold, Handler<Either<String, JsonObject>> handler);

	void quotaAndUsage(String userId, Handler<Either<String, JsonObject>> handler);

	void quotaAndUsageStructure(String structureId, Handler<Either<String, JsonObject>> handler);

	void quotaAndUsageGlobal(Handler<Either<String, JsonObject>> handler);

	void update(JsonArray users, long quota, Handler<Either<String, JsonArray>> handler);

	void updateQuotaDefaultMax(String profile, Long defaultQuota, Long maxQuota,
			Handler<Either<String, JsonObject>> handler);

	void getDefaultMaxQuota(Handler<Either<String, JsonArray>> handler);

	void init(String userId);

}
