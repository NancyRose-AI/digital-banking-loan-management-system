FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng
ENV TESSDATA_PREFIX=/usr/share/tessdata
COPY --from=build /app/target/*.jar app.jar


ENTRYPOINT ["java", "-jar", "/app/app.jar"]
