import os
from openai import OpenAI
from config.settings import settings

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", settings.OPENAI_API_KEY))

async def generate_prestige_audit(company_name: str, website_url: str = None, industry: str = "Général"):
    """
    Génère un rapport d'audit IA haute couture pour convaincre le prospect.
    """
    prompt = f"""
    Tu es l'Analyste IA de Master BlackWay. Ton ton est direct, expert, élite et sans détour.
    Analyse le potentiel de performance opérationnelle pour l'entreprise suivante :
    Nom : {company_name}
    URL : {website_url if website_url else 'Non fournie'}
    Industrie : {industry}

    Génère un rapport structuré en 3 points :
    1. DIAGNOSTIC DES FUITES : Où cette entreprise perd-elle de l'argent actuellement (inefficience, manque d'automatisation) ?
    2. POTENTIEL D'ACCÉLÉRATION : Comment l'IA BlackWay peut doubler leur conversion.
    3. SCORE DE PERFORMANCE : Un score sur 100 de leur état actuel.

    Le ton doit être provocateur mais professionnel (Prestige). Termine par une recommandation d'activation immédiate de l'Architecture de Performance BlackWay.
    """

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[{"role": "system", "content": "Tu es l'Analyste Master BlackWay."}, {"role": "user", "content": prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content
