package org.entcore.cas.mapping;

import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import java.util.*;

public class MappingService {
    private static MappingService instance = new MappingService();
    public static final String COLLECTION = "casMapping";
    private final MongoDb mongoDb = MongoDb.getInstance();
    private final Neo4j neo = Neo4j.getInstance();
    private Future<Mappings> cacheMapping;
    private Future<JsonArray> cacheStructures;

    private MappingService(){ }

    public static MappingService getInstance(){
        return instance;
    }

    public void reset(){
        cacheMapping = null;
        cacheStructures = null;
    }

    public Future<Void> create(JsonObject data){
        final Future<Void> future = Future.future();
        if(data.containsKey("type")){
            data.put("_id", data.getString("type"));
            data.remove("type");
        }
        mongoDb.insert(COLLECTION, data, r->{
            if ("ok".equals(r.body().getString("status"))) {
                future.complete();
            } else{
                future.fail(r.body().getString("message"));
            }
        });
        return future;
    }

    public Future<Mappings> getMappings() {
        if (cacheMapping == null) {
            final Future<Mappings> futureMapping = Future.future();
            //load mappings
            final Map<String, Mapping> rows = new HashMap<>();
            //final String mappingJson = new String(Files.readAllBytes(Paths.get(RegisteredServices.class.getResource(MAPPING_FILE).toURI())));
            //final JsonObject mappingJsonObject = new JsonObject(mappingJson);
            mongoDb.find(COLLECTION, new JsonObject(),r->{
                final JsonArray results = r.body().getJsonArray("results");
                if ("ok".equals(r.body().getString("status")) && results != null) {
                    for (final Object row : results) {
                        final JsonObject info = (JsonObject)row;
                        final String key = info.getString("_id");
                        final Mapping mapping = new Mapping(key, info.getString("casType"), info.getString("pattern"));
                        rows.put(key, mapping);
                    }
                    futureMapping.complete(new Mappings(rows));
                } else {
                    futureMapping.fail(r.body().getString("message"));
                }
            });
            //load structures
            cacheMapping = futureMapping.compose(r->{
                final Mappings tmp = (Mappings)r;
                final Future<Mappings> future = Future.future();
                getStructures().setHandler(resStruct -> {
                    if(resStruct.succeeded()){
                        for(final Object o : resStruct.result()){
                            final JsonObject json = (JsonObject)o;
                            final String id = json.getString("id");
                            final JsonArray parents = json.getJsonArray("parents", new JsonArray());
                            for(final Object parent : parents){
                                final JsonObject parentJ = (JsonObject)parent;
                                final String parentId = parentJ.getString("id");
                                tmp.addStructure(id, parentId);
                            }
                        }
                        tmp.computeHierarchy();
                        future.complete(tmp);
                    }else{
                        future.fail(resStruct.cause());
                    }
                });
                return future;
            });
        }
        return cacheMapping;
    }

    public Future<JsonArray> getStructures(){
        if(cacheStructures==null){
            cacheStructures = Future.future();
            final StringBuilder query = new StringBuilder();
            query.append("MATCH (s:Structure) OPTIONAL MATCH (s)-[r:HAS_ATTACHMENT]->(ps:Structure) ");
            query.append("WITH s, COLLECT({id: ps.id, name: ps.name}) as parents ");
            query.append("RETURN s.id as id , CASE WHEN any(p in parents where p <> {id: null, name: null}) THEN parents END as parents ");
            neo.execute(query.toString(), new JsonObject(), Neo4jResult.validResultHandler(r->{
                if(r.isLeft()){
                    cacheStructures.fail(r.left().getValue());
                }else{
                    cacheStructures.complete(r.right().getValue());
                }
            }));
        }
        return cacheStructures;
    }

    public static class Mappings{
        private final Map<String, Mapping> rowsByType;
        private final Map<String, Set<String>> structuresWithChildren = new HashMap<>();
        private final Map<String, Set<String>> structuresWithDescendants = new HashMap<>();
        private Mappings(Map<String, Mapping> rows) {
            this.rowsByType = rows;
        }

        public void addStructure(final String structureId, String parentId){
            this.structuresWithChildren.putIfAbsent(structureId, new HashSet<>());
            if(parentId != null){
                this.structuresWithChildren.putIfAbsent(parentId, new HashSet<>());
                this.structuresWithChildren.get(parentId).add(structureId);
            }
        }

        private Set<String> getDescendants(final String structureId){
            final Set<String> all = new HashSet<>();
            final Set<String> children = this.structuresWithChildren.getOrDefault(structureId, new HashSet<>());
            for(final String child : children){
                all.add(child);
                all.addAll(getDescendants(child));
            }
            return all;
        }

        public void computeHierarchy(){
            for(final String structureId : structuresWithChildren.keySet()){
                this.structuresWithDescendants.put(structureId, getDescendants(structureId));
            }
        }

        public JsonArray toJson(){
            final JsonArray all = new JsonArray();
            for(final Mapping mapping : rowsByType.values()){
                all.add(new JsonObject().put("casType", mapping.getCasType()).put("pattern", mapping.getPattern()).put("type", mapping.getType()));
            }
            return all;
        }

        public Optional<Mapping> find(Optional<String> structureId, String casType, String pattern){
            for(Mapping mapping: rowsByType.values()){
                if(mapping.getCasType().equals(casType) && mapping.getPattern().equals(pattern)){
                    if(structureId.isPresent()){
                        final Set<String> descendantAndSelf = structuresWithDescendants.getOrDefault(structureId.get(), new HashSet<>());
                        descendantAndSelf.add(structureId.get());
                        return Optional.of(mapping.copyWith(descendantAndSelf, false));
                    } else {
                        return Optional.of(mapping.copyWith(new HashSet<>(), true));
                    }
                }
            }
            return Optional.empty();
        }

    }
}
