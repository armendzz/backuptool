<?php


$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);


function file_contents_exist($url, $response_code = 200){
    $headers = get_headers($url);
    if (substr($headers[0], 9, 3) == $response_code) {
        return TRUE;
    } else {
        return FALSE;
    }
}



// Überprüfen ob field 'url' existiert
if (isset($data['url'])) {

    $xmlOderHomepageUrl = $data['url'];

    $headers = @get_headers($xmlOderHomepageUrl);
    
    // Überprüfen ob die URL existiert
    if ($headers && strpos($headers[0], '200')) {

        // Wenn sitemap url eingetragen ist
        if (str_ends_with($xmlOderHomepageUrl, '.xml')) {

            // Erhalten die XML-Datei und konvertieren in ein Array
            $xmlfile = file_get_contents($xmlOderHomepageUrl);
            $new = simplexml_load_string($xmlfile);
            $con = json_encode($new);
            $newArr = json_decode($con, true);

            // Array zurückgeben an Front-End
            echo json_encode($newArr);
        } else {

            // Überprüfen ob die XML file existiert
            if (!file_contents_exist($xmlOderHomepageUrl . "/robots.txt")) {
                echo "404";
                die();
            }

            // Wenn nur Homepage eingetragen ist
            $robots_file = file_get_contents($xmlOderHomepageUrl . "/robots.txt");

            // Finden die Sitemap-URL aus robots.txt
            $pattern = '/Sitemap: ([^\s]+)/';
            preg_match($pattern, $robots_file, $match);

            $xmlFileFromHomeUrl =  substr($match[0], 9);


            // Erhalten die XML-Datei und konvertieren in ein Array
            $xmlfile = file_get_contents($xmlFileFromHomeUrl);
            $new = simplexml_load_string($xmlfile);
            $con = json_encode($new);
            $newArr = json_decode($con, true);

            $allUrls = [];
            $allArr = [];

            // Alle Sub-Sitemaps in Array eine konvertieren
            foreach ($newArr['sitemap'] as $xml) {

                $xmlfile = file_get_contents($xml['loc']);
                $new = simplexml_load_string($xmlfile);
                $con = json_encode($new);
                $newArr = json_decode($con, true);
                array_push($allArr, $newArr);
            }

            // Alle Sub-Sitemaps urls in Array eine konvertieren
            foreach ($allArr as $arr) {
                foreach ($arr['url'] as $block) {
                    $allUrls['url'][] = $block;
                }
            }

            // Array zurückgeben an Front-End
            echo json_encode($allUrls);
        }
    } else {
        echo "404";
        die();
    }
}

// Single url backup
if (isset($data['singleurl'])) {

    $singleUrl = $data['singleurl'];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://web.archive.org/save/" . $singleUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, "url=" . $singleUrl . "&capture_all=on");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $output = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo $httpcode;
}
