/*
 * Copyright © WebServices pour l'Éducation, 2016
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

package org.entcore.conversation.filters;

import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.http.Binding;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.sql.Sql;
import org.entcore.common.sql.SqlResult;
import org.entcore.common.user.UserInfos;

import java.util.List;

public class FoldersMessagesFilter extends FoldersFilter {

	@Override
	public void authorize(final HttpServerRequest request, Binding binding,
			final UserInfos user, final Handler<Boolean> handler) {

		super.authorize(request, binding, user, new Handler<Boolean>() {
			@Override
			public void handle(Boolean event) {
				if(event){
					RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
						public void handle(final JsonObject body) {
							final List<String> messageIds = body.getJsonArray("id", new fr.wseduc.webutils.collections.JsonArray()).getList();
							String usersQuery =
									"SELECT count(distinct um) AS number FROM conversation.usermessages um " +
											"WHERE um.user_id = ? AND um.message_id IN " + Sql.listPrepared(messageIds.toArray());
							JsonArray values = new fr.wseduc.webutils.collections.JsonArray()
									.add(user.getUserId());
							for(String id : messageIds){
								values.add(id);
							}

							request.pause();

							sql.prepared(usersQuery, values, SqlResult.validUniqueResultHandler(new Handler<Either<String,JsonObject>>() {
								public void handle(Either<String, JsonObject> event) {

									request.resume();

									if(event.isLeft()){
										handler.handle(false);
										return;
									}

									int count = event.right().getValue().getInteger("number", 0);
									handler.handle(count == messageIds.size());
								}
							}));
						}
					});


				}else{
					handler.handle(false);
					return;
				}
			}
		});

	}

}
