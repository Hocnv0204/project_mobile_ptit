import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;

public class TestYTSubs {
    public static void main(String[] args) throws Exception {
        String videoId = "pUiXx3pDHo8";
        String url = "https://www.youtube.com/watch?v=" + videoId;
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept-Language", "en-US,en;q=0.9")
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        String html = response.body();
        
        Pattern pattern = Pattern.compile("\"captionTracks\":\\[(.*?)\\]");
        Matcher matcher = pattern.matcher(html);
        if (matcher.find()) {
            String captionTracksJson = "[" + matcher.group(1) + "]";
            System.out.println("Found captionTracks: " + captionTracksJson);
            
            // Extract the first baseUrl
            Pattern urlPattern = Pattern.compile("\"baseUrl\":\"(.*?)\"");
            Matcher urlMatcher = urlPattern.matcher(captionTracksJson);
            if (urlMatcher.find()) {
                String baseUrl = urlMatcher.group(1).replace("\\u0026", "&");
                System.out.println("Base URL: " + baseUrl);
                
                HttpRequest subRequest = HttpRequest.newBuilder()
                        .uri(URI.create(baseUrl))
                        .header("User-Agent", "Mozilla/5.0")
                        .GET()
                        .build();
                HttpResponse<String> subResponse = client.send(subRequest, HttpResponse.BodyHandlers.ofString());
                String xml = subResponse.body();
                System.out.println("XML: " + xml.substring(0, Math.min(xml.length(), 200)));
                
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes()));
                NodeList texts = doc.getElementsByTagName("text");
                for (int i = 0; i < Math.min(3, texts.getLength()); i++) {
                    Element textElement = (Element) texts.item(i);
                    String start = textElement.getAttribute("start");
                    String dur = textElement.getAttribute("dur");
                    String content = textElement.getTextContent();
                    System.out.println("Start: " + start + ", Dur: " + dur + ", Text: " + content);
                }
            } else {
                System.out.println("No baseUrl found");
            }
        } else {
            System.out.println("No captionTracks found");
        }
    }
}
