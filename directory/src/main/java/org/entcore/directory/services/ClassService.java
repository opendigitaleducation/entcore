package org.entcore.directory.services;


import edu.one.core.infra.Either;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;

import java.util.Arrays;
import java.util.List;

public interface ClassService {

	List<String> CLASS_FIELDS = Arrays.asList("id", "name", "level");

	List<String> CLASS_REQUIRED_FIELDS = Arrays.asList("id", "name");

	List<String> UPDATE_CLASS_FIELDS = Arrays.asList("level", "name");

	void create(String schoolId, JsonObject c, Handler<Either<String, JsonObject>> result);

	void update(String classId, JsonObject c, Handler<Either<String, JsonObject>> result);

}
