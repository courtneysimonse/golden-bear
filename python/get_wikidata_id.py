import sys
import csv
from SPARQLWrapper import SPARQLWrapper, JSON

# Wikidata SPARQL endpoint
endpoint_url = "https://query.wikidata.org/sparql"

# Primary query to find city or subclass of city
def generate_primary_query(city, country):
    return f"""
    SELECT DISTINCT ?item WHERE {{
      ?item ?label "{city}"@en.
      ?item wdt:P17 ?country.
      ?country ?label "{country}"@en.
      ?item wdt:P31/wdt:P279* wd:Q515.  # Include subclasses of city
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """

# Fallback query to find any entity
def generate_fallback_query(city, country):
    return f"""
    SELECT DISTINCT ?item WHERE {{
      ?item ?label "{city}"@en.
      ?item wdt:P17 ?country.
      ?country ?label "{country}"@en.
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """

# Function to get results from the SPARQL endpoint
def get_results(endpoint_url, query):
    user_agent = "CityCountryLookupScript/1.0 (courtney@artemismaps.com)"
    sparql = SPARQLWrapper(endpoint_url, agent=user_agent)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    return sparql.query().convert()

# Main function to process the CSV and return results
def process_csv(input_csv):
    results = []
    with open(input_csv, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            city = row["Cleaned Port"].strip()
            country = row["Country"].strip()

            # Try primary query
            query = generate_primary_query(city, country)
            try:
                sparql_results = get_results(endpoint_url, query)
                wikidata_ids = [
                    result["item"]["value"].split("/")[-1]
                    for result in sparql_results["results"]["bindings"]
                ]
                if wikidata_ids:
                    wikidata_id = wikidata_ids[0]
                else:
                    # If no results, try fallback query
                    query = generate_fallback_query(city, country)
                    sparql_results = get_results(endpoint_url, query)
                    wikidata_ids = [
                        result["item"]["value"].split("/")[-1]
                        for result in sparql_results["results"]["bindings"]
                    ]
                    wikidata_id = wikidata_ids[0] if wikidata_ids else ""
                results.append({"City": city, "Country": country, "WikidataID": wikidata_id})
            except Exception as e:
                print(f"Error processing {city}, {country}: {e}")
                results.append({"City": city, "Country": country, "WikidataID": ""})
    return results

# Output the results
def main():
    input_csv = "ports.csv"  # Replace with your CSV file path
    output_csv = "output_wikidata_ids.csv"  # Output file

    results = process_csv(input_csv)
    
    # Save results to CSV
    with open(output_csv, mode='w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ["City", "Country", "WikidataID"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"Results saved to {output_csv}")

if __name__ == "__main__":
    main()
