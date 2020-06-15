/*
 * Copyright © "Open Digital Education", 2015
 *
 * This program is published by "Open Digital Education".
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https://opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.

 */

package org.entcore.auth.services;

import org.entcore.auth.services.impl.DefaultSafeRedirectionService;

import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;

public interface SafeRedirectionService {

    static class SafeRedirectionServiceHolder {
        private static final SafeRedirectionService instance = new DefaultSafeRedirectionService();
    }

    static SafeRedirectionService getInstance() {
        return SafeRedirectionServiceHolder.instance;
    }

    void init(Vertx vertx, JsonObject config);

    void canRedirectTo(String uri, Handler<Boolean> handler);

    void redirect(HttpServerRequest request, String path);

    void redirect(HttpServerRequest request, String host, String path);

    void redirect(HttpServerRequest request, String host, String path, String fallbackPath);

}
